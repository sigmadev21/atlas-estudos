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

1. Crie um usuário em **Authentication → Users**. Digite o email e uma senha nova diretamente no Supabase; não use a senha do banco.
2. Execute `supabase/schema.sql` no SQL Editor do projeto.
3. Abra **Authentication → Users**, copie o ID desse usuário, e execute no SQL Editor: `insert into public.atlas_admins (user_id) values ('COLE-O-ID-AQUI');`
4. Em **Authentication → URL Configuration**, adicione a URL do site publicado em **Redirect URLs**.

A tela pede o email e a senha do usuário admin. A autorização de administrador fica no banco pelo ID da conta e não expõe o email no repositório. A publishable key foi feita para uso no frontend com RLS habilitado. **Nunca coloque a service-role key ou outra chave secreta no site.**

O projeto Atlas já inclui a URL e a publishable key do Supabase. Qualquer visitante pode ler os materiais e provas; somente uma conta explicitamente adicionada à tabela `atlas_admins` pode inserir dados, conforme as políticas RLS.

## Como cadastrar quizzes

No painel, escolha o tipo **Quiz** e escreva uma pergunta por linha neste formato:

`Pergunta | opção 1 | opção 2 | opção 3 | opção 4 | número da resposta certa | explicação`

## Personalização

A interface está em `index.html` e `styles.css`. A lógica de navegação e quizzes fica em `app.js`; integração com o banco em `backend.js`; políticas e tabelas em `supabase/schema.sql`.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
