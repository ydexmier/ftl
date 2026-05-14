'use client';
import { useEffect } from 'react';
import { driver } from 'driver.js';

export function OnboardingTour() {
  useEffect(() => {
    if (!sessionStorage.getItem('ftl_onboarding_pending')) return;

    const complete = () => {
      sessionStorage.removeItem('ftl_onboarding_pending');
      fetch('/api/user/onboarding', { method: 'PATCH' }).catch(() => {});
    };

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Suivant →',
      prevBtnText: '← Retour',
      doneBtnText: 'Terminer',
      onDestroyStarted: () => {
        complete();
        driverObj.destroy();
      },
      steps: [
        {
          popover: {
            title: 'Bienvenue sur Companion !',
            description: 'Découvrez en quelques étapes comment utiliser cette application compagnon pour vos tournois Disney Lorcana.',
            align: 'center',
          },
        },
        {
          element: '[data-tour="home-tournaments"]',
          popover: {
            title: 'Tournois',
            description: 'Accédez à vos tournois. Pendant les rondes, scoutez les combinaisons d\'encres jouées par vos adversaires en temps réel.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="home-groups"]',
          popover: {
            title: 'Groupes',
            description: 'Rejoignez un groupe pour partager le scouting avec votre équipe. Tous les membres voient les mêmes informations simultanément.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="nav-profile"]',
          popover: {
            title: 'Votre profil',
            description: 'Modifiez votre nom d\'utilisateur, votre email ou votre mot de passe depuis votre profil.',
            side: 'bottom',
          },
        },
      ],
    });

    const t = setTimeout(() => driverObj.drive(), 600);
    return () => clearTimeout(t);
  }, []);

  return null;
}
