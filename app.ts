import fastify from "fastify";

const server = fastify();

type StandardAbbreviation = "c" | "s" | "l";

function getName(abbreviation: StandardAbbreviation) {
  switch (abbreviation) {
    case "c":
      return "Children's";
    case "s":
      return "Westminster Shorter";
    case "l":
      return "Westminster Larger";
    default:
      throw new Error("Invalid data type");
  }
}

async function getData(abbreviation: StandardAbbreviation) {
  switch (abbreviation) {
    case "c":
      return (await import("./data/childrens.json")).default;
    case "s":
      return (await import("./data/shorter.json")).default;
    case "l":
      return (await import("./data/larger.json")).default;
    default:
      throw new Error("Invalid data type");
  }
}

server.get("/ping", async (request, reply) => {
  return "pong\n";
});

server.get("/health", async (_, reply) => {
  return reply.status(200).send({ success: true });
});

server.get<{
  Params: { standard: StandardAbbreviation };
  Querystring: { q: string };
}>("/:standard", async (request, reply) => {
  const {
    params: { standard },
    query: { q },
  } = request;
  if (!standard || !["c", "s", "l"].includes(standard)) {
    return reply.status(400).send({
      success: false,
      message: "Please specify a standard: c, s, or l.",
    });
  }
  let data = await getData(standard);
  if (q) {
    data = data.filter((item) => item.join().toLowerCase().includes(q));
  }
  return reply.send({ data, success: true });
});

server.get<{
  Params: { standard: StandardAbbreviation; question: string };
}>("/:standard/:question", async (request, reply) => {
  const {
    params: { standard, question },
  } = request;
  if (!standard || !["c", "s", "l"].includes(standard)) {
    return reply.status(400).send({
      message: "Please specify a standard: c, s, or l.",
      success: false,
    });
  }
  if (!question) {
    return reply.status(400).send({
      message: "Please specify a question number.",
      success: false,
    });
  }
  const data = await getData(standard);
  const found = data.find((item) => item[0] == request.params.question);
  if (found) {
    return reply.send({ data: found, success: true });
  }
  return reply.status(404).send({
    message: `Not found: the ${getName(
      standard
    )} Catechism contains questions 1-${data.length}.`,
    success: false,
  });
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
