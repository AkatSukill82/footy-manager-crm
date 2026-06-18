import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function TransferForm({ playerId, onSubmit }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    player_id: playerId,
    date_transfert: "",
    club_depart: "",
    club_arrivee: "",
    montant: "",
    type_transfert: "Transfert définitif",
    duree_contrat: "",
    date_fin_pret: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      player_id: playerId,
      date_transfert: "",
      club_depart: "",
      club_arrivee: "",
      montant: "",
      type_transfert: "Transfert définitif",
      duree_contrat: "",
      date_fin_pret: "",
      notes: ""
    });
  };

  const isPret = formData.type_transfert === "Prêt";

  return null;
















































































































}