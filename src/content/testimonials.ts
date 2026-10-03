export type Testimonial = {
  id: string;
  author: string;
  text: string;
  example: boolean;
  instagram?: string;
};

export const testimonialContent = {
  eyebrow: "Histórias da Beecah",
  title: "Perfumes que ficam.",
  accent: "Histórias também.",
  description: "Cada fragrância encontra uma história. Descubra esse encontro.",
  action: "Ver todos os depoimentos",
  demo: "Esta seleção inclui depoimentos ilustrativos",
  example: "Depoimento de exemplo",
  drag: "Arraste os cards para explorar",
  keyboard: "Use as setas para mover o card e Escape para reposicionar.",
  reset: "Reorganizar cards",
  pageTitle: "Depoimentos",
  pageDescription: "Um espaço para as experiências de quem escolhe a Beecah.",
  notice:
    "Relatos enviados por clientes aparecem após aprovação. Os cards marcados como exemplo são ilustrativos.",
  share: "Conte sua experiência",
  home: "Início",
  collection: "Explorar perfumes",
} as const;

export const testimonials: Testimonial[] = [
  {
    id: "01",
    author: "Ana Silva",
    text: "Encontrei uma fragrância para chamar de minha.",
    example: true,
  },
  {
    id: "02",
    author: "Mariana Costa",
    text: "Um perfume que transforma pequenos momentos em boas lembranças.",
    example: true,
  },
  {
    id: "03",
    author: "Lucas Oliveira",
    text: "Minha próxima escolha já tem lugar nos favoritos.",
    example: true,
  },
  {
    id: "04",
    author: "Juliana Santos",
    text: "Notas que combinam com meu jeito e acompanham meus dias.",
    example: true,
  },
  {
    id: "05",
    author: "Camila Souza",
    text: "Uma nova descoberta para os momentos que quero guardar.",
    example: true,
  },
  {
    id: "06",
    author: "Rafael Almeida",
    text: "Entre tantas fragrâncias, encontrei a que tem a minha personalidade.",
    example: true,
  },
];
