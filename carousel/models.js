export function createCarouselProject() {
  return {
    article: {
      url: "",
      title: "",
      category: "",
      image: "",
      images: [],
      summary: "",
      content: ""
    },
    editorialPlan: null,
    slides: [],
    settings: {
      format: "instagram",
      width: 1080,
      height: 1350,
      coverLogoPosition: "center",
      useSecondaryImages: false
    }
  };
}
