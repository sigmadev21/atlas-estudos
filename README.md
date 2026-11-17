# Atlas

Um espaço pessoal para reunir materiais, praticar com quizzes e acompanhar as próximas provas. O site é estático e pode ser publicado pelo GitHub Pages.

## O que tem

- Biblioteca de PDFs, slides, resumos, links e quizzes, com busca e filtros.
- Página inicial com os materiais cadastrados, contagens e próximas provas.
- Favoritos salvos neste navegador.
- Quizzes interativos com pontuação e explicações para revisar as respostas erradas.
- Datas de provas com contagem regressiva.
- Modo foco, tema azul-escuro, visual Liquid Glass e navegação adaptada para celular e computador.
- Painel local para adicionar materiais e provas.

## Como usar

Abra `index.html` no navegador ou publique o repositório pelo GitHub Pages em **Settings → Pages → Deploy from a branch → main → /(root)**.

O painel admin salva materiais, favoritos, provas e resultados no `localStorage` do navegador. Como o GitHub Pages não tem servidor, essas alterações ficam neste dispositivo e não são sincronizadas automaticamente com o repositório. Para publicar novos arquivos para outras pessoas ou dispositivos, adicione-os ao repositório e atualize o link no site.

Para cadastrar um quiz no painel, escolha o tipo **Quiz** e escreva uma pergunta por linha neste formato:

`Pergunta | opção 1 | opção 2 | opção 3 | opção 4 | número da resposta certa | explicação`

## Personalização

Os materiais e as datas são cadastrados pelo painel e salvos neste navegador. O visual e os pontos de quebra responsivos estão em `styles.css`.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
