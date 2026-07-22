export function createSlide() {
  return {
    id: "",
    type: "",
    template: "",
    order: 0,
    content: {
      title: "",
      subtitle: "",
      text: "",
      items: [],
      image: ""
    },
    style: {
      theme: "default",
      background: "image",
      accent: ""
    }
  };
}
