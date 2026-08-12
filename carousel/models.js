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
    editorialPackage: null,
    categoryOptions: [],
    selectedCategoryId: "",
    manualSlideImages: {},
    socialCopy: {
      caption: "",
      hashtags: []
    },
    slides: [],
    settings: {
      format: "instagram",
      width: 1080,
      height: 1350,
      coverLogoPosition: "right",
      useSecondaryImages: false
    }
  };
}
