Deno.serve(async () => {
  return Response.json({ error: "Fonctionnalité retirée — utiliser besoccerProxy." }, { status: 410 });
});
