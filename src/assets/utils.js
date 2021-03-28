// https://medium.com/trabe/manipulating-images-using-the-canvas-api-98dc77352ddc
export const cropImage = (source, crop) => {
  // console.log("---cropImage", crop);
  if (crop.coordinates) {
    const { visibleArea } = crop;
    const canvas = document.createElement("canvas");
    // console.log("---canvas", canvas);
    canvas.width = visibleArea.width;
    canvas.height = visibleArea.height;
    const ctx = canvas.getContext("2d");
    // console.log("---ctx", ctx);
    const { coordinates } = crop;
    // console.log("---use coordinates", coordinates);
    ctx.drawImage(
      source,
      coordinates.left,
      coordinates.top,
      coordinates.width,
      coordinates.height,
      0,
      0,
      coordinates.width,
      coordinates.height
    );
    // const img = ctx.getImageData(0, 0, coordinates.width, coordinates.height);
    // const imgData = img.data;
    // const nctx = ctx.getImageData(0,0, coordinates.width, coordinates.height);

    const img = new Image();
    img.src = canvas.toDataURL("image/png");
    // cropped image
    return img;
  }
};
