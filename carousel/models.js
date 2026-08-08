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
    reelPlan: null,
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
