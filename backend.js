(() => {
  const cfg = window.ATLAS_SUPABASE_CONFIG || {};
  let client = null;
  let session = null;
  let sessionHandler = () => {};
  let isAdmin = false;
  const configured = Boolean(cfg.url && cfg.publishableKey && window.supabase?.createClient);

  async function syncSession(nextSession) {
    session = nextSession;
    isAdmin = false;
    if (session) {
      const {data, error} = await client.rpc("is_atlas_admin");
      isAdmin = !error && data === true;
    }
    sessionHandler(session, isAdmin);
  }

  function init() {
    if (!configured) return false;
    client = window.supabase.createClient(cfg.url, cfg.publishableKey);
    client.auth.getSession().then(({data}) => syncSession(data.session));
    client.auth.onAuthStateChange((_event, newSession) => {
      setTimeout(() => syncSession(newSession), 0);
    });
    return true;
  }

  function requireAdmin() {
    if (!client) throw new Error("O banco do Atlas ainda não foi configurado.");
    if (!session || !isAdmin) throw new Error("Entre com a conta admin autorizada para fazer alterações.");
  }

  async function loadSharedData() {
    if (!client) return {materials: [], exams: []};
    const [materialsResult, examsResult] = await Promise.all([
      client.from("materials").select("*").order("created_at", {ascending: false}),
      client.from("exams").select("*").order("exam_date", {ascending: true})
    ]);
    if (materialsResult.error) throw materialsResult.error;
    if (examsResult.error) throw examsResult.error;
    return {
      materials: materialsResult.data || [],
      exams: (examsResult.data || []).map(row => ({id: row.id, title: row.title, subject: row.subject, date: row.exam_date}))
    };
  }

  async function login(email, password) {
    if (!client) throw new Error("O banco compartilhado ainda não está conectado.");
    const {data, error} = await client.auth.signInWithPassword({email: String(email).trim(), password});
    if (error) throw new Error("Não foi possível entrar. Confere o email e a senha da conta criada no Supabase.");
    await syncSession(data.session);
    if (!isAdmin) {
      await client.auth.signOut();
      session = null;
      isAdmin = false;
      sessionHandler(null, false);
      throw new Error("Essa conta ainda não tem permissão de admin no Atlas.");
    }
    return session;
  }

  async function logout() {
    if (!client) return;
    const {error} = await client.auth.signOut();
    if (error) throw error;
    session = null;
    isAdmin = false;
    sessionHandler(null, false);
  }

  async function saveMaterial(material, file) {
    requireAdmin();
    let url = material.url || "";
    if (file) {
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `${crypto.randomUUID()}-${safeName}`;
      const {error: uploadError} = await client.storage.from("atlas-materials").upload(path, file, {upsert: false});
      if (uploadError) throw uploadError;
      url = client.storage.from("atlas-materials").getPublicUrl(path).data.publicUrl;
    }
    const row = {...material, url};
    const {data, error} = await client.from("materials").insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async function saveExam(exam) {
    requireAdmin();
    const {data, error} = await client.from("exams").insert({
      id: exam.id, title: exam.title, subject: exam.subject, exam_date: exam.date
    }).select().single();
    if (error) throw error;
    return {id: data.id, title: data.title, subject: data.subject, date: data.exam_date};
  }

  window.AtlasBackend = {
    configured, init, loadSharedData, login, logout, saveMaterial, saveExam,
    getSession: () => session,
    isAdmin: () => isAdmin,
    setSessionHandler: handler => {sessionHandler = handler; sessionHandler(session, isAdmin);}
  };
})();
