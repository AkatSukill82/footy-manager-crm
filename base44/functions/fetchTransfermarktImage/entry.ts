Deno.serve(async () => {
  return Response.json({ error: "Fonctionnalité retirée." }, { status: 410 });
});
