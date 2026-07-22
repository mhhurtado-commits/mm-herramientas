export function renderTemplate(slide) {
  switch (slide.template) {
    case "cover":
      return renderCover(slide);
    case "text":
      return renderText(slide);
    case "stats":
      return renderStats(slide);
    case "end":
      return renderEnd(slide);
    default:
      return renderText(slide);
  }
}

function renderCover(slide) {
  var imageHtml = slide.content.image
    ? '<img src="' + slide.content.image + '" style="width:100%;height:200px;object-fit:cover;border-radius:12px 12px 0 0" />'
    : '<div style="height:200px;background:#e0e0e0;border-radius:12px 12px 0 0"></div>';

  return (
    imageHtml +
    '<div style="padding:20px">' +
    '<h2 style="margin:0 0 8px;font-size:22px;line-height:1.2">' + slide.content.title + "</h2>" +
    (slide.content.subtitle
      ? '<p style="margin:0;font-size:14px;color:#555">' + slide.content.subtitle + "</p>"
      : "") +
    "</div>"
  );
}

function renderText(slide) {
  return (
    '<div style="padding:24px">' +
    '<h3 style="margin:0 0 10px;font-size:18px">' + slide.content.title + "</h3>" +
    (slide.content.text
      ? '<p style="margin:0;font-size:14px;line-height:1.5;color:#333">' + slide.content.text + "</p>"
      : "") +
    "</div>"
  );
}

function renderStats(slide) {
  var itemsHtml = "";
  if (slide.content.items && slide.content.items.length) {
    itemsHtml = "<ul style='margin:10px 0 0;padding-left:18px'>";
    for (var i = 0; i < slide.content.items.length; i++) {
      itemsHtml += "<li style='margin-bottom:6px;font-size:14px;color:#333'>" + slide.content.items[i] + "</li>";
    }
    itemsHtml += "</ul>";
  }

  return (
    '<div style="padding:24px">' +
    '<h3 style="margin:0 0 4px;font-size:18px">' + slide.content.title + "</h3>" +
    itemsHtml +
    "</div>"
  );
}

function renderEnd(slide) {
  return (
    '<div style="padding:24px;text-align:center">' +
    '<h3 style="margin:0 0 10px;font-size:18px">' + slide.content.title + "</h3>" +
    (slide.content.text
      ? '<p style="margin:0;font-size:14px;line-height:1.5;color:#333">' + slide.content.text + "</p>"
      : "") +
    "</div>"
  );
}
