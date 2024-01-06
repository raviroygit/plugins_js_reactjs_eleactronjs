const PDFJS = require('./build/pdf');
var PDF_DOC, HTMLElement;


const view_pdf = async (data, successCallback, errorCallback) => {
  try {
    const uri = URL.createObjectURL(data.file);
    var _PDF_DOC = await PDFJS.getDocument({ url: uri });
    const canvas = data.canvasRef.current
    HTMLElement = canvas;
    var page = await _PDF_DOC.getPage(1);
    PDF_DOC = _PDF_DOC;
    var viewport = page.getViewport({ scale: 1 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    var render_context = {
      canvasContext: canvas.getContext("2d"),
      viewport: viewport
    };
    await page.render(render_context).promise;

    if (successCallback) successCallback(_PDF_DOC);
  } catch (error) {
    if (errorCallback) errorCallback(error.message)
  }
};

const pageChangeReRender = async (pageNumber, successCallback, errorCallback) => {
  try {

    var page = await PDF_DOC.getPage(pageNumber);
    var viewport = page.getViewport({ scale: 1 });
    HTMLElement.height = viewport.height;
    HTMLElement.width = viewport.width;
    var render_context = {
      canvasContext: HTMLElement.getContext("2d"),
      viewport: viewport
    };
    await page.render(render_context).promise;

  } catch (err) {
    if (errorCallback) errorCallback(err)
  }

}

module.exports = {
  view_pdf,
  pageChangeReRender
}