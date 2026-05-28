Deno.serve(async () => {
  return Response.json({ error: "Fonctionnalité retirée — utiliser API-Football." }, { status: 410 });
});
