import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Helper: encode text for jsPDF latin-1 (fixes accented characters)
function enc(str) {
  if (!str) return '';
  return String(str)
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '?'); // strip anything outside latin-1
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, filters } = await req.json();

    // Fetch data
    const players = await base44.entities.Player.list();
    const transfers = await base44.entities.Transfer.list();
    const teams = await base44.entities.Team.filter({ created_by: user.email });
    const teamPlayers = await base44.entities.TeamPlayer.filter({ created_by: user.email });

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text('Football CRM - Rapport', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(enc(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`), pageWidth / 2, 30, { align: 'center' });
    
    if (filters.dateDebut || filters.dateFin) {
      doc.setFontSize(10);
      const periodText = enc(`Periode: ${filters.dateDebut || 'Debut'} - ${filters.dateFin || "Aujourd'hui"}`);
      doc.text(periodText, pageWidth / 2, 37, { align: 'center' });
    }

    let y = 50;

    // Content based on report type
    if (reportType === 'players') {
      doc.setFontSize(16);
      doc.text('Rapport de Performance des Joueurs', 20, y);
      y += 10;

      const filteredPlayers = players.filter(p => {
        if (filters.dateDebut && p.created_date) {
          return new Date(p.created_date) >= new Date(filters.dateDebut);
        }
        return true;
      });

      doc.setFontSize(12);
      doc.text(`Nombre total de joueurs: ${filteredPlayers.length}`, 20, y);
      y += 8;

      const totalValue = filteredPlayers.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0);
      doc.text(enc(`Valeur totale: ${totalValue.toFixed(1)}M EUR`), 20, y);
      y += 8;

      const avgAge = filteredPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / (filteredPlayers.length || 1);
      doc.text(enc(`Age moyen: ${avgAge.toFixed(1)} ans`), 20, y);
      y += 15;

      // Top players
      doc.setFontSize(14);
      doc.text('Top 10 joueurs par valeur:', 20, y);
      y += 8;

      doc.setFontSize(10);
      const topPlayers = [...filteredPlayers]
        .filter(p => p.valeur_marchande)
        .sort((a, b) => b.valeur_marchande - a.valeur_marchande)
        .slice(0, 10);

      topPlayers.forEach((player, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(enc(`${index + 1}. ${player.nom} - ${player.valeur_marchande}M EUR (${player.poste}, ${player.age} ans)`), 25, y);
        y += 6;
      });

    } else if (reportType === 'transfers') {
      doc.setFontSize(16);
      doc.text('Rapport des Tendances de Transferts', 20, y);
      y += 10;

      const filteredTransfers = transfers.filter(t => {
        const date = new Date(t.date_transfert);
        if (filters.dateDebut && date < new Date(filters.dateDebut)) return false;
        if (filters.dateFin && date > new Date(filters.dateFin)) return false;
        return true;
      });

      doc.setFontSize(12);
      doc.text(`Nombre total de transferts: ${filteredTransfers.length}`, 20, y);
      y += 8;

      const totalValue = filteredTransfers.reduce((sum, t) => sum + (t.montant || 0), 0);
      doc.text(enc(`Valeur totale: ${totalValue.toFixed(1)}M EUR`), 20, y);
      y += 8;

      const avgValue = filteredTransfers.filter(t => t.montant).length > 0
        ? totalValue / filteredTransfers.filter(t => t.montant).length
        : 0;
      doc.text(enc(`Valeur moyenne: ${avgValue.toFixed(1)}M EUR`), 20, y);
      y += 15;

      // Transfer types
      doc.setFontSize(14);
      doc.text(enc('Repartition par type:'), 20, y);
      y += 8;

      const types = {};
      filteredTransfers.forEach(t => {
        types[t.type_transfert] = (types[t.type_transfert] || 0) + 1;
      });

      doc.setFontSize(10);
      Object.entries(types).forEach(([type, count]) => {
        doc.text(enc(`${type}: ${count} (${(count / filteredTransfers.length * 100).toFixed(1)}%)`), 25, y);
        y += 6;
      });

    } else if (reportType === 'teams') {
      doc.setFontSize(16);
      doc.text(enc("Rapport d'Efficacite des Equipes"), 20, y);
      y += 10;

      doc.setFontSize(12);
      doc.text(enc(`Nombre d'equipes: ${teams.length}`), 20, y);
      y += 8;

      const activeTeams = teams.filter(t => t.matchs_joues > 0).length;
      doc.text(enc(`Equipes actives: ${activeTeams}`), 20, y);
      y += 15;

      // Team rankings
      doc.setFontSize(14);
      doc.text(enc('Classement des equipes:'), 20, y);
      y += 8;

      const rankedTeams = [...teams]
        .filter(t => t.matchs_joues > 0)
        .map(t => ({
          ...t,
          points: (t.victoires || 0) * 3 + (t.nuls || 0),
          goalDiff: (t.buts_pour || 0) - (t.buts_contre || 0)
        }))
        .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);

      doc.setFontSize(10);
      rankedTeams.forEach((team, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          enc(`${index + 1}. ${team.nom} - ${team.points} pts (${team.victoires}V-${team.nuls}N-${team.defaites}D)`),
          25,
          y
        );
        y += 6;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=rapport-${reportType}-${Date.now()}.pdf`
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});