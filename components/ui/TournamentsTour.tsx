'use client';
import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';

const STORAGE_KEY = 'ftl_tournaments_tour_done';

export function TournamentsTour() {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const steps: DriveStep[] = [
      {
        popover: {
          title: 'Vos tournois',
          description: 'Cette page centralise tous vos tournois Disney Lorcana. Voici comment l\'utiliser.',
          align: 'center',
        },
      },
      {
        element: '[data-tour="tournaments-search"]',
        popover: {
          title: 'Rechercher un tournoi',
          description: 'Tapez le nom ou l\'ID d\'un tournoi Ravensburger pour le retrouver et le lier à votre compte. Une fois lié, il apparaît dans vos tournois.',
          side: 'bottom',
        },
      },
    ];

    if (document.querySelector('[data-tour="tournaments-personal"]')) {
      steps.push({
        element: '[data-tour="tournaments-personal"]',
        popover: {
          title: 'Mes tournois',
          description: 'Vos tournois personnels. Cliquez sur l\'un d\'eux pour accéder au scouting des rondes en temps réel.',
          side: 'bottom',
        },
      });
    }

    if (document.querySelector('[data-tour="tournaments-groups"]')) {
      steps.push({
        element: '[data-tour="tournaments-groups"]',
        popover: {
          title: 'Tournois de groupe',
          description: 'Les tournois partagés avec votre groupe. Le scouting est visible et modifiable par tous les membres simultanément.',
          side: 'bottom',
        },
      });
    }

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
      steps,
    });

    const t = setTimeout(() => driverObj.drive(), 700);
    return () => clearTimeout(t);
  }, []);

  return null;
}
