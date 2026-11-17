(() => {
  const cfg = window.ATLAS_SUPABASE_CONFIG || {};
  let session = null;
  let accessToken = "";
  let refreshToken = "";
  let isAdmin = false;
  let sessionHandler = () => {};
  const configured = Boolean(cfg.url && cfg.publishableKey);
  const sessionKey = "atlas-auth-session";

  function saveSession(data) {
    accessToken = data.access_token || "";
    refreshToken = data.refresh_token || "";
    session = data.user ? {user: data.user} : null;
    if (accessToken && refreshToken) {
      sessionStorage.setItem(sessionKey, JSON.stringify({accessToken, refreshToken, user: data.user}));
    } else {
      sessionStorage.removeItem(sessionKey);
    }
  }

  function clearSession() {
    accessToken = "";
    refreshToken = "";
    session = null;
    isAdmin = false;
    sessionStorage.removeItem(sessionKey);
  }

  async function request(path, {method = "GET", body, auth = Boolean(accessToken), raw = false, headers = {}} = {}) {
    if (!configured) throw new Error("O banco do Atlas ainda não foi configurado.");
    if (auth && accessToken) await refreshIfNeeded();
    const requestHeaders = {
      apikey: cfg.publishableKey,
      Authorization: `Bearer ${auth && accessToken ? accessToken : cfg.publishableKey}`,
      ...headers
    };
    let requestBody;
    if (body !== undefined) {
      if (raw) requestBody = body;
      else {
        requestHeaders["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }
    }
    const response = await fetch(`${cfg.url}${path}`, {method, headers: requestHeaders, body: requestBody});
    const text = await response.text();
    let result = null;
    if (text) {
      try { result = JSON.parse(text); }
      catch { result = text; }
    }
    if (!response.ok) {
      throw new Error(result?.msg || result?.message || result?.error_description || result?.error || `Supabase request failed (${response.status})`);
    }
    return result;
  }

  async function refreshIfNeeded() {
    if (!accessToken || !refreshToken) return;
    try {
      const encoded = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(encoded + "=".repeat((4 - encoded.length % 4) % 4)));
      if (Number(payload.exp) > Date.now() / 1000 + 60) return;
    } catch { return; }
    const result = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", body: {refresh_token: refreshToken}, auth: false
    });
    saveSession(result);
  }

  async function syncSession() {
    isAdmin = false;
    if (session && accessToken) {
      try {
        isAdmin = await request("/rest/v1/rpc/is_atlas_admin", {method: "POST", body: {}, auth: true}) === true;
      } catch { isAdmin = false; }
    }
    sessionHandler(session, isAdmin);
  }

  function init() {
    if (!configured) return false;
    try {
      const saved = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
      if (saved?.accessToken && saved?.refreshToken && saved?.user) {
        accessToken = saved.accessToken;
        refreshToken = saved.refreshToken;
        session = {user: saved.user};
        syncSession();
      }
    } catch { sessionStorage.removeItem(sessionKey); }
    return true;
  }

  async function loadSharedData() {
    if (!configured) return {materials: [], exams: []};
    const [materials, exams] = await Promise.all([
      request("/rest/v1/materials?select=*&order=created_at.desc", {auth: Boolean(accessToken)}),
      request("/rest/v1/exams?select=*&order=exam_date.asc", {auth: Boolean(accessToken)})
    ]);
    return {
      materials: materials || [],
      exams: (exams || []).map(row => ({id: row.id, title: row.title, subject: row.subject, date: row.exam_date}))
    };
  }

  async function login(email, password) {
    if (!configured) throw new Error("O banco compartilhado ainda não está conectado.");
    const result = await request("/auth/v1/token?grant_type=password", {
      method: "POST", body: {email: String(email).trim(), password}, auth: false
    });
    saveSession(result);
    await syncSession();
    if (!isAdmin) {
      await request("/auth/v1/logout", {method: "POST", auth: true}).catch(() => {});
      clearSession();
      sessionHandler(null, false);
      throw new Error("Essa conta ainda não tem permissão de admin no Atlas.");
    }
    return session;
  }

  async function logout() {
    if (accessToken) await request("/auth/v1/logout", {method: "POST", auth: true}).catch(() => {});
    clearSession();
    sessionHandler(null, false);
  }

  async function saveMaterial(material, file) {
    if (!session || !isAdmin) throw new Error("Entre com a conta admin autorizada para fazer alterações.");
    let url = material.url || "";
    if (file) {
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `${crypto.randomUUID()}-${safeName}`;
      await request(`/storage/v1/object/atlas-materials/${encodeURIComponent(path)}`, {
        method: "POST", body: file, auth: true, raw: true,
        headers: {"Content-Type": file.type || "application/octet-stream", "x-upsert": "false"}
      });
      url = `${cfg.url}/storage/v1/object/public/atlas-materials/${encodeURIComponent(path)}`;
    }
    const rows = await request("/rest/v1/materials", {
      method: "POST", body: {...material, url}, auth: true, headers: {Prefer: "return=representation"}
    });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function saveExam(exam) {
    if (!session || !isAdmin) throw new Error("Entre com a conta admin autorizada para fazer alterações.");
    const rows = await request("/rest/v1/exams", {
      method: "POST",
      body: {id: exam.id, title: exam.title, subject: exam.subject, exam_date: exam.date},
      auth: true, headers: {Prefer: "return=representation"}
    });
    const row = Array.isArray(rows) ? rows[0] : rows;
    return {id: row.id, title: row.title, subject: row.subject, date: row.exam_date};
  }

  window.AtlasBackend = {
    configured, init, loadSharedData, login, logout, saveMaterial, saveExam,
    getSession: () => session,
    isAdmin: () => isAdmin,
    setSessionHandler: handler => {sessionHandler = handler; sessionHandler(session, isAdmin);}
  };
})();
