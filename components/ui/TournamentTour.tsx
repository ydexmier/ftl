'use client';
import { useEffect } from 'react';
import { driver } from 'driver.js';

const STORAGE_KEY = 'ftl_tournament_tour_done';

export function TournamentTour() {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Suivant →',
      prevBtnText: '← Retour',
      doneBtnText: 'Terminer',
      onDestroyStarted: () => {
        localStorage.setItem(STORAGE_KEY, '1');
        driverObj.destroy();
      },
      steps: [
        {
          element: '[data-tour="tournament-header"]',
          popover: {
            title: 'Informations du tournoi',
            description: 'Nom, nombre de joueurs inscrits et capacité totale du tournoi.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="tournament-fetch-btn"]',
          popover: {
            title: 'Mettre à jour',
            description: 'Synchronise les données depuis Ravensburger. À utiliser au début de chaque ronde pour récupérer les derniers appariements.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="tournament-tabs"]',
          popover: {
            title: 'Onglets de navigation',
            description: 'Naviguez entre le scouting des rondes, la liste des joueurs, et les rapports (si disponibles).',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="tournament-round-select"]',
          popover: {
            title: 'Sélection de la ronde',
            description: 'Choisissez la ronde active. Les matchs de la ronde s\'affichent en dessous — cliquez sur un match pour assigner les combinaisons d\'encres.',
            side: 'bottom',
          },
        },
      ],
    });

    const t = setTimeout(() => driverObj.drive(), 700);
    return () => clearTimeout(t);
  }, []);

  return null;
}
