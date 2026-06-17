// Compte API-Football suspendu — remplacé par fotmobProxy
Deno.serve(async () => {
  return Response.json({ error: "Compte suspendu — utiliser fotmobProxy." }, { status: 410 });
});
