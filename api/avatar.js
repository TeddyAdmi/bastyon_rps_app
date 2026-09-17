module.exports = async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const url =
    req.query &&
    req.query.url;

  if (!url) {
    return res
      .status(400)
      .send("url is required");
  }

  let target;

  try {
    target = new URL(url);
  } catch (error) {
    return res
      .status(400)
      .send("invalid url");
  }

  if (
    target.protocol !==
      "https:" ||
    target.hostname !==
      "bastyon.com" ||
    target.port !==
      "8092" ||
    !target.pathname.startsWith(
      "/i/"
    )
  ) {
    return res
      .status(403)
      .send("forbidden");
  }

  try {
    const response =
      await fetch(
        target.toString()
      );

    if (!response.ok) {
      return res
        .status(
          response.status
        )
        .send(
          "avatar unavailable"
        );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) ||
      "image/jpeg";

    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      );

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400"
    );

    return res
      .status(200)
      .send(buffer);

  } catch (error) {
    console.log(
      "AVATAR PROXY ERROR",
      error &&
      error.message
        ? error.message
        : String(error)
    );

    return res
      .status(502)
      .send(
        "avatar fetch failed"
      );
  }
};
