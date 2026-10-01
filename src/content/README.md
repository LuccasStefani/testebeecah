# Textos da interface

Os textos fixos ficam em arquivos TypeScript por área:

- `store.ts`: página inicial, navegação, rodapé e páginas institucionais.
- `catalog.ts`: catálogo, coleções e detalhes do perfume.
- `account.ts`: entrada, cadastro e conta do cliente.
- `checkout.ts`: sacola e etapas da compra.
- `admin.ts`: painel e formulários administrativos.

Cada objeto usa `as const satisfies ContentDictionary`: as chaves e os valores são tipados. Importe somente o conteúdo da área necessária. Não coloque consultas SQL, classes Tailwind ou segredos nestes arquivos. Os dados de produtos, pedidos, clientes e banners continuam vindo das fontes existentes.

Os estilos Tailwind reutilizáveis ficam em `src/styles`. Classes locais simples podem ficar no componente. Os nomes de marcação presentes nos grupos permitem variantes para filhos e estados sem um arquivo CSS por página.

O arquivo `app/globals.css` guarda a configuração do Tailwind, o tema, as fontes, os estilos de base e keyframes compartilhados.

Use `npm run format` para formatar e `npm run format:check` para conferir o padrão. Valide também com `npx tsc --noEmit` e `npm run lint`.
