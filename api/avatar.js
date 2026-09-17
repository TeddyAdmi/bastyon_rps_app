const https = require("https");

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
    target.protocol !== "https:" ||
    target.hostname !== "bastyon.com" ||
    target.port !== "8092" ||
    !target.pathname.startsWith("/i/")
  ) {
    return res
      .status(403)
      .send("forbidden");
  }

  try {
    const image = await new Promise(
      (resolve, reject) => {
        const request =
          https.get(
            {
              hostname:
                "bastyon.com",

              port: 8092,

              path:
                target.pathname +
                target.search,

              method: "GET",

              servername:
                "bastyon.com",

              rejectUnauthorized:
                false,

              headers: {
                "User-Agent":
                  "Bastyon-KNB/1.0",
                "Accept":
                  "image/avif,image/webp,image/apng,image/jpeg,image/png,*/*"
              }
            },
            (response) => {
              const chunks = [];
              let totalSize = 0;

              response.on(
                "data",
                (chunk) => {
                  totalSize +=
                    chunk.length;

                  if (
                    totalSize >
                    5 * 1024 * 1024
                  ) {
                    request.destroy(
                      new Error(
                        "image too large"
                      )
                    );

                    return;
                  }

                  chunks.push(chunk);
                }
              );

              response.on(
                "end",
                () => {
                  if (
                    response.statusCode <
                      200 ||
                    response.statusCode >=
                      300
                  ) {
                    reject(
                      new Error(
                        "HTTP " +
                        response.statusCode
                      )
                    );

                    return;
                  }

                  resolve({
                    buffer:
                      Buffer.concat(
                        chunks
                      ),

                    contentType:
                      response.headers[
                        "content-type"
                      ] ||
                      "image/jpeg"
                  });
                }
              );

              response.on(
                "error",
                reject
              );
            }
          );

        request.on(
          "error",
          reject
        );

        request.setTimeout(
          15000,
          () => {
            request.destroy(
              new Error(
                "request timeout"
              )
            );
          }
        );
      }
    );

    res.setHeader(
      "Content-Type",
      image.contentType
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400"
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    return res
      .status(200)
      .send(image.buffer);

  } catch (error) {
    console.log(
      "AVATAR PROXY ERROR:",
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
