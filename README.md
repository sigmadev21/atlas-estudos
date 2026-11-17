# Atlas

Um espaço pessoal para organizar materiais de estudo, praticar com quizzes e acompanhar provas. O acervo compartilhado é público para leitura e só a conta admin pode alterá-lo.

## O que tem

- Biblioteca pública de PDFs, slides, resumos, links e quizzes, com busca e filtros.
- Painel admin autenticado para adicionar materiais e provas.
- Upload de arquivos para o Supabase Storage.
- Quizzes com pontuação e explicações para revisar respostas erradas.
- Datas de provas com contagem regressiva.
- Favoritos e resultados de quiz salvos localmente por visitante.
- Tema roxo-escuro Liquid Glass, modo foco e layout responsivo.

## Conectar o Supabase

1. Crie um projeto Supabase e um usuário em **Authentication → Users** para o email admin. Defina a senha diretamente no Supabase.
2. Em `supabase/schema.sql`, substitua `YOUR_ADMIN_EMAIL` pelo email desse usuário e execute o arquivo no SQL Editor do Supabase.
3. Copie o Project URL e a publishable key para `supabase-config.js`, junto com o mesmo email em `adminEmail`.
4. Configure a URL do GitHub Pages como URL permitida no Supabase Auth.

A tela usa o nome de usuário `admin` e encaminha a autenticação para o email configurado. A publishable key foi feita para uso no frontend com RLS habilitado. **Nunca coloque a service-role key ou outra chave secreta no site.**

Até o Supabase ser configurado, o site não aceita novos materiais ou provas e mostra um aviso de conexão pendente. Depois, qualquer visitante pode ler os dados; somente o email admin configurado pode inserir dados, conforme as políticas RLS.

## Como cadastrar quizzes

No painel, escolha o tipo **Quiz** e escreva uma pergunta por linha neste formato:

`Pergunta | opção 1 | opção 2 | opção 3 | opção 4 | número da resposta certa | explicação`

## Personalização

A interface está em `index.html` e `styles.css`. A lógica de navegação e quizzes fica em `app.js`; integração com o banco em `backend.js`; políticas e tabelas em `supabase/schema.sql`.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
