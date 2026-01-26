import React, { useCallback, useState } from "react";
import { Link } from "wouter";
import { Cpu, Info, Globe, Shield, Activity, HardDrive, UserCheck, ExternalLink, Mail, Zap, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container } from "@tsparticles/engine";

type Language = "RU" | "EN" | "UA" | "PL" | "DE";

const translations: Record<Language, {
  title: string;
  lastUpdate: string;
  overview: string;
  overviewTitle: string;
  overviewDescription: string;
  featuresTitle: string;
  features: string[];
  policyExplanation: string;
  keyPoint: string;
  keyPointText: string;
  dataNotCollectedTitle: string;
  dataNotCollected: string[];
  externalServicesTitle: string;
  analyticsServer: string;
  analyticsService: string;
  analyticsPurpose: string;
  faceitApi: string;
  faceitService: string;
  faceitPurpose: string;
  technicalInfoTitle: string;
  technicalInfoDescription: string;
  technicalInfoItems: string[];
  technicalInfoImportant: string;
  localStorageTitle: string;
  localStorageDescription: string;
  localStorageItems: string[];
  localStorageNote: string;
  yourRightsTitle: string;
  deletion: string;
  deletionText: string;
  dataClear: string;
  dataClearText: string;
  optOut: string;
  optOutText: string;
  thirdPartyTitle: string;
  thirdPartyText: string;
  policyChangesTitle: string;
  policyChangesText: string;
  legalBasisTitle: string;
  legalBasisText: string;
  dataSecurityTitle: string;
  dataSecurityText: string;
  contactTitle: string;
  contactText: string;
  responseTime: string;
  service: string;
  purpose: string;
}> = {
  RU: {
    title: "Политика конфиденциальности",
    lastUpdate: "Последнее обновление: 27 января 2026",
    overview: "1. Обзор",
    overviewTitle: "FACEITracker",
    overviewDescription: "— это браузерное расширение для отслеживания активности и статистики игроков CS2 на платформе FACEIT в реальном времени. Расширение предоставляет актуальные данные о матчах и игроках без необходимости авторизации.",
    featuresTitle: "Основные возможности:",
    features: [
      "Отслеживание начала матчей у выбранных игроков в режиме реального времени",
      "Автоматическое обновление статуса игроков и матчей в фоновом режиме",
      "Отображение текущего ELO и уровня FACEIT (1–10)",
      "Просмотр истории последних матчей с результатами побед и поражений",
      "Детальная информация об игроках на карточках профиля (аватар, рейтинг, уровень)",
      "Выделение игроков из чёрного списка в матчах с пользовательскими пометками",
      "Быстрый доступ к статистике без перехода на страницы профилей",
      "Поддержка EN, RU, UA, PL, DE"
    ],
    policyExplanation: "Данная политика объясняет, как расширение обрабатывает данные при предоставлении этих функций.",
    keyPoint: "Ключевой момент",
    keyPointText: "Данное расширение не собирает, не хранит и не обрабатывает никакой персональной информации, такой как имена, адреса электронной почты, история браузера, пароли или личные файлы.",
    dataNotCollectedTitle: "2. Данные, которые мы НЕ собираем",
    dataNotCollected: [
      "Персональную идентификационную информацию (имена, электронные адреса, номера телефонов)",
      "Историю браузера или посещения веб-сайтов",
      "Пароли или учетные данные для входа",
      "Личные файлы или документы",
      "Данные о местоположении, кроме автоматически включаемых в HTTP-запросы"
    ],
    externalServicesTitle: "3. Связь с внешними сервисами",
    analyticsServer: "3.1. Сервер аналитики разработчика",
    analyticsService: "api.faceitracker.net",
    analyticsPurpose: "Сервис для сбора и обработки анонимной аналитики, например для подсчёта количества активных пользователей и мониторинга онлайн",
    faceitApi: "3.2. Публичный API FACEIT",
    faceitService: "open.faceit.com",
    faceitPurpose: "Доступ к публичной статистике матчей и игроков для анализа и отображения игровой информации",
    technicalInfoTitle: "4. Автоматическая техническая информация",
    technicalInfoDescription: "Как и во всех интернет-соединениях, HTTP-запросы могут автоматически включать стандартную техническую информацию, такую как:",
    technicalInfoItems: [
      "IP-адрес (необходим для интернет-соединения)",
      "Строка user-agent браузера",
      "Базовые заголовки запросов"
    ],
    technicalInfoImportant: "Эта техническая информация может временно сохраняться в логах сервера для технических целей и обеспечения надежности сервиса. Она не используется для идентификации пользователей и не передается третьим лицам.",
    localStorageTitle: "5. Локальное хранение данных",
    localStorageDescription: "Расширение может временно хранить данные локально в вашем браузере для оптимизации производительности, включая:",
    localStorageItems: [
      "Кэшированная статистика FACEIT (временная, автоматически очищается)",
      "Настройки и предпочтения расширения"
    ],
    localStorageNote: "Эти данные остаются на вашем устройстве и не передаются на внешние серверы.",
    yourRightsTitle: "6. Ваши права и варианты выбора",
    deletion: "Удаление:",
    deletionText: "Вы можете удалить расширение в любое время через страницу управления расширениями браузера",
    dataClear: "Очистка данных:",
    dataClearText: "Удаление расширения удаляет все локально сохраненные данные",
    optOut: "Отказ:",
    optOutText: "Просто удалите расширение, чтобы прекратить всю обработку данных",
    thirdPartyTitle: "7. Сторонние сервисы",
    thirdPartyText: "Это расширение использует публичный API FACEIT. Пожалуйста, ознакомьтесь с Политикой конфиденциальности FACEIT для получения информации об их методах обработки данных.",
    policyChangesTitle: "8. Изменения в данной политике",
    policyChangesText: "Мы можем периодически обновлять данную политику конфиденциальности. Любые изменения будут отражены путем обновления даты \"Последнее обновление\" в верхней части страницы. Продолжение использования расширения после изменений означает принятие обновленной политики.",
    legalBasisTitle: "9. Правовая основа (для пользователей ЕС)",
    legalBasisText: "Для пользователей в Европейском Союзе наша правовая основа для обработки данных — законный интерес в предоставлении функциональности расширения и анонимном измерении статистики использования.",
    dataSecurityTitle: "10. Безопасность данных",
    dataSecurityText: "Хотя мы не собираем личные данные, мы применяем соответствующие технические меры для обеспечения безопасности любых передач данных и гарантируем, что расширение работает безопасно в рамках модели безопасности вашего браузера.",
    contactTitle: "11. Контактная информация",
    contactText: "Если у вас есть вопросы или замечания по поводу данной политики конфиденциальности:",
    responseTime: "Время ответа: Мы стремимся отвечать в течение 72 часов.",
    service: "Сервис:",
    purpose: "Цель:"
  },
  EN: {
    title: "Privacy Policy",
    lastUpdate: "Last updated: January 27, 2026",
    overview: "1. Overview",
    overviewTitle: "FACEITracker",
    overviewDescription: "is a browser extension for tracking CS2 player activity and statistics on the FACEIT platform in real-time. The extension provides up-to-date match and player data without requiring authentication.",
    featuresTitle: "Main features:",
    features: [
      "Real-time tracking of match starts for selected players",
      "Automatic background updates of player and match status",
      "Display of current ELO and FACEIT level (1–10)",
      "View recent match history with win/loss results",
      "Detailed player information on profile cards (avatar, rating, level)",
      "Highlighting blacklisted players in matches with custom notes",
      "Quick access to statistics without navigating to profile pages",
      "Support for EN, RU, UA, PL, DE"
    ],
    policyExplanation: "This policy explains how the extension handles data while providing these features.",
    keyPoint: "Key Point",
    keyPointText: "This extension does not collect, store, or process any personal information such as names, email addresses, browser history, passwords, or personal files.",
    dataNotCollectedTitle: "2. Data We DO NOT Collect",
    dataNotCollected: [
      "Personal identification information (names, email addresses, phone numbers)",
      "Browser history or website visits",
      "Passwords or login credentials",
      "Personal files or documents",
      "Location data, except what is automatically included in HTTP requests"
    ],
    externalServicesTitle: "3. Communication with External Services",
    analyticsServer: "3.1. Developer Analytics Server",
    analyticsService: "api.faceitracker.net",
    analyticsPurpose: "Service for collecting and processing anonymous analytics, such as counting active users and monitoring online status",
    faceitApi: "3.2. Public FACEIT API",
    faceitService: "open.faceit.com",
    faceitPurpose: "Access to public match and player statistics for analysis and display of game information",
    technicalInfoTitle: "4. Automatic Technical Information",
    technicalInfoDescription: "As with all internet connections, HTTP requests may automatically include standard technical information such as:",
    technicalInfoItems: [
      "IP address (required for internet connection)",
      "Browser user-agent string",
      "Basic request headers"
    ],
    technicalInfoImportant: "This technical information may be temporarily stored in server logs for technical purposes and service reliability. It is not used to identify users and is not shared with third parties.",
    localStorageTitle: "5. Local Data Storage",
    localStorageDescription: "The extension may temporarily store data locally in your browser to optimize performance, including:",
    localStorageItems: [
      "Cached FACEIT statistics (temporary, automatically cleared)",
      "Extension settings and preferences"
    ],
    localStorageNote: "This data remains on your device and is not transmitted to external servers.",
    yourRightsTitle: "6. Your Rights and Choices",
    deletion: "Deletion:",
    deletionText: "You can remove the extension at any time through your browser's extension management page",
    dataClear: "Data Clearing:",
    dataClearText: "Removing the extension deletes all locally stored data",
    optOut: "Opt-out:",
    optOutText: "Simply remove the extension to stop all data processing",
    thirdPartyTitle: "7. Third-Party Services",
    thirdPartyText: "This extension uses the public FACEIT API. Please review FACEIT's Privacy Policy for information about their data handling practices.",
    policyChangesTitle: "8. Changes to This Policy",
    policyChangesText: "We may periodically update this privacy policy. Any changes will be reflected by updating the \"Last Updated\" date at the top of this page. Continued use of the extension after changes constitutes acceptance of the updated policy.",
    legalBasisTitle: "9. Legal Basis (for EU Users)",
    legalBasisText: "For users in the European Union, our legal basis for data processing is legitimate interest in providing extension functionality and anonymously measuring usage statistics.",
    dataSecurityTitle: "10. Data Security",
    dataSecurityText: "Although we do not collect personal data, we implement appropriate technical measures to ensure the security of any data transmissions and guarantee that the extension operates safely within your browser's security model.",
    contactTitle: "11. Contact Information",
    contactText: "If you have questions or comments about this privacy policy:",
    responseTime: "Response time: We aim to respond within 72 hours.",
    service: "Service:",
    purpose: "Purpose:"
  },
  UA: {
    title: "Політика конфіденційності",
    lastUpdate: "Останнє оновлення: 27 січня 2026",
    overview: "1. Огляд",
    overviewTitle: "FACEITracker",
    overviewDescription: "— це браузерне розширення для відстеження активності та статистики гравців CS2 на платформі FACEIT у реальному часі. Розширення надає актуальні дані про матчі та гравців без необхідності авторизації.",
    featuresTitle: "Основні можливості:",
    features: [
      "Відстеження початку матчів у вибраних гравців у режимі реального часу",
      "Автоматичне оновлення статусу гравців та матчів у фоновому режимі",
      "Відображення поточного ELO та рівня FACEIT (1–10)",
      "Перегляд історії останніх матчів з результатами перемог та поразок",
      "Детальна інформація про гравців на картках профілю (аватар, рейтинг, рівень)",
      "Виділення гравців з чорного списку в матчах з користувацькими позначками",
      "Швидкий доступ до статистики без переходу на сторінки профілів",
      "Підтримка EN, RU, UA, PL, DE"
    ],
    policyExplanation: "Ця політика пояснює, як розширення обробляє дані при наданні цих функцій.",
    keyPoint: "Ключовий момент",
    keyPointText: "Це розширення не збирає, не зберігає і не обробляє жодної персональної інформації, такої як імена, адреси електронної пошти, історія браузера, паролі або особисті файли.",
    dataNotCollectedTitle: "2. Дані, які ми НЕ збираємо",
    dataNotCollected: [
      "Персональну ідентифікаційну інформацію (імена, електронні адреси, номери телефонів)",
      "Історію браузера або відвідування веб-сайтів",
      "Паролі або облікові дані для входу",
      "Особисті файли або документи",
      "Дані про місцезнаходження, крім автоматично включених в HTTP-запити"
    ],
    externalServicesTitle: "3. Зв'язок із зовнішніми сервісами",
    analyticsServer: "3.1. Сервер аналітики розробника",
    analyticsService: "api.faceitracker.net",
    analyticsPurpose: "Сервіс для збору та обробки анонімної аналітики, наприклад для підрахунку кількості активних користувачів та моніторингу онлайн",
    faceitApi: "3.2. Публічний API FACEIT",
    faceitService: "open.faceit.com",
    faceitPurpose: "Доступ до публічної статистики матчів та гравців для аналізу та відображення ігрової інформації",
    technicalInfoTitle: "4. Автоматична технічна інформація",
    technicalInfoDescription: "Як і в усіх інтернет-з'єднаннях, HTTP-запити можуть автоматично включати стандартну технічну інформацію, таку як:",
    technicalInfoItems: [
      "IP-адреса (необхідна для інтернет-з'єднання)",
      "Рядок user-agent браузера",
      "Базові заголовки запитів"
    ],
    technicalInfoImportant: "Ця технічна інформація може тимчасово зберігатися в логах сервера для технічних цілей та забезпечення надійності сервісу. Вона не використовується для ідентифікації користувачів і не передається третім особам.",
    localStorageTitle: "5. Локальне зберігання даних",
    localStorageDescription: "Розширення може тимчасово зберігати дані локально у вашому браузері для оптимізації продуктивності, включаючи:",
    localStorageItems: [
      "Кешована статистика FACEIT (тимчасова, автоматично очищається)",
      "Налаштування та переваги розширення"
    ],
    localStorageNote: "Ці дані залишаються на вашому пристрої і не передаються на зовнішні сервери.",
    yourRightsTitle: "6. Ваші права та варіанти вибору",
    deletion: "Видалення:",
    deletionText: "Ви можете видалити розширення в будь-який час через сторінку керування розширеннями браузера",
    dataClear: "Очищення даних:",
    dataClearText: "Видалення розширення видаляє всі локально збережені дані",
    optOut: "Відмова:",
    optOutText: "Просто видаліть розширення, щоб припинити всю обробку даних",
    thirdPartyTitle: "7. Сторонні сервіси",
    thirdPartyText: "Це розширення використовує публічний API FACEIT. Будь ласка, ознайомтеся з Політикою конфіденційності FACEIT для отримання інформації про їхні методи обробки даних.",
    policyChangesTitle: "8. Зміни в цій політиці",
    policyChangesText: "Ми можемо періодично оновлювати цю політику конфіденційності. Будь-які зміни будуть відображені шляхом оновлення дати \"Останнє оновлення\" у верхній частині сторінки. Продовження використання розширення після змін означає прийняття оновленої політики.",
    legalBasisTitle: "9. Правова основа (для користувачів ЄС)",
    legalBasisText: "Для користувачів у Європейському Союзі наша правова основа для обробки даних — законний інтерес у наданні функціональності розширення та анонімному вимірюванні статистики використання.",
    dataSecurityTitle: "10. Безпека даних",
    dataSecurityText: "Хоча ми не збираємо особисті дані, ми застосовуємо відповідні технічні заходи для забезпечення безпеки будь-яких передач даних і гарантуємо, що розширення працює безпечно в рамках моделі безпеки вашого браузера.",
    contactTitle: "11. Контактна інформація",
    contactText: "Якщо у вас є питання або зауваження щодо цієї політики конфіденційності:",
    responseTime: "Час відповіді: Ми прагнемо відповідати протягом 72 годин.",
    service: "Сервіс:",
    purpose: "Мета:"
  },
  PL: {
    title: "Polityka Prywatności",
    lastUpdate: "Ostatnia aktualizacja: 27 stycznia 2026",
    overview: "1. Przegląd",
    overviewTitle: "FACEITracker",
    overviewDescription: "to rozszerzenie przeglądarki do śledzenia aktywności i statystyk graczy CS2 na platformie FACEIT w czasie rzeczywistym. Rozszerzenie dostarcza aktualne dane o meczach i graczach bez konieczności autoryzacji.",
    featuresTitle: "Główne funkcje:",
    features: [
      "Śledzenie rozpoczęcia meczów wybranych graczy w czasie rzeczywistym",
      "Automatyczna aktualizacja statusu graczy i meczów w tle",
      "Wyświetlanie aktualnego ELO i poziomu FACEIT (1–10)",
      "Przeglądanie historii ostatnich meczów z wynikami wygranych i przegranych",
      "Szczegółowe informacje o graczach na kartach profilu (awatar, ocena, poziom)",
      "Wyróżnianie graczy z czarnej listy w meczach z niestandardowymi notatkami",
      "Szybki dostęp do statystyk bez przechodzenia na strony profili",
      "Obsługa EN, RU, UA, PL, DE"
    ],
    policyExplanation: "Ta polityka wyjaśnia, jak rozszerzenie przetwarza dane podczas świadczenia tych funkcji.",
    keyPoint: "Kluczowy punkt",
    keyPointText: "To rozszerzenie nie zbiera, nie przechowuje ani nie przetwarza żadnych danych osobowych, takich jak imiona, adresy e-mail, historia przeglądarki, hasła lub pliki osobiste.",
    dataNotCollectedTitle: "2. Dane, których NIE zbieramy",
    dataNotCollected: [
      "Dane identyfikacyjne (imiona, adresy e-mail, numery telefonów)",
      "Historia przeglądarki lub odwiedzin stron internetowych",
      "Hasła lub dane logowania",
      "Pliki osobiste lub dokumenty",
      "Dane lokalizacyjne, z wyjątkiem automatycznie dołączanych do żądań HTTP"
    ],
    externalServicesTitle: "3. Komunikacja z usługami zewnętrznymi",
    analyticsServer: "3.1. Serwer analityczny dewelopera",
    analyticsService: "api.faceitracker.net",
    analyticsPurpose: "Usługa do zbierania i przetwarzania anonimowych analiz, np. liczenia aktywnych użytkowników i monitorowania statusu online",
    faceitApi: "3.2. Publiczne API FACEIT",
    faceitService: "open.faceit.com",
    faceitPurpose: "Dostęp do publicznych statystyk meczów i graczy do analizy i wyświetlania informacji o grze",
    technicalInfoTitle: "4. Automatyczne informacje techniczne",
    technicalInfoDescription: "Jak we wszystkich połączeniach internetowych, żądania HTTP mogą automatycznie zawierać standardowe informacje techniczne, takie jak:",
    technicalInfoItems: [
      "Adres IP (wymagany do połączenia internetowego)",
      "Ciąg user-agent przeglądarki",
      "Podstawowe nagłówki żądań"
    ],
    technicalInfoImportant: "Te informacje techniczne mogą być tymczasowo przechowywane w logach serwera w celach technicznych i zapewnienia niezawodności usługi. Nie są wykorzystywane do identyfikacji użytkowników i nie są udostępniane stronom trzecim.",
    localStorageTitle: "5. Lokalne przechowywanie danych",
    localStorageDescription: "Rozszerzenie może tymczasowo przechowywać dane lokalnie w przeglądarce w celu optymalizacji wydajności, w tym:",
    localStorageItems: [
      "Zbuforowane statystyki FACEIT (tymczasowe, automatycznie czyszczone)",
      "Ustawienia i preferencje rozszerzenia"
    ],
    localStorageNote: "Te dane pozostają na Twoim urządzeniu i nie są przesyłane na zewnętrzne serwery.",
    yourRightsTitle: "6. Twoje prawa i wybory",
    deletion: "Usunięcie:",
    deletionText: "Możesz usunąć rozszerzenie w dowolnym momencie przez stronę zarządzania rozszerzeniami przeglądarki",
    dataClear: "Czyszczenie danych:",
    dataClearText: "Usunięcie rozszerzenia usuwa wszystkie lokalnie zapisane dane",
    optOut: "Rezygnacja:",
    optOutText: "Po prostu usuń rozszerzenie, aby zatrzymać całe przetwarzanie danych",
    thirdPartyTitle: "7. Usługi stron trzecich",
    thirdPartyText: "To rozszerzenie korzysta z publicznego API FACEIT. Zapoznaj się z Polityką Prywatności FACEIT, aby uzyskać informacje o ich praktykach przetwarzania danych.",
    policyChangesTitle: "8. Zmiany w tej polityce",
    policyChangesText: "Możemy okresowo aktualizować tę politykę prywatności. Wszelkie zmiany zostaną odzwierciedlone poprzez aktualizację daty \"Ostatnia aktualizacja\" na górze tej strony. Dalsze korzystanie z rozszerzenia po zmianach oznacza akceptację zaktualizowanej polityki.",
    legalBasisTitle: "9. Podstawa prawna (dla użytkowników UE)",
    legalBasisText: "Dla użytkowników w Unii Europejskiej naszą podstawą prawną do przetwarzania danych jest uzasadniony interes w zapewnieniu funkcjonalności rozszerzenia i anonimowym mierzeniu statystyk użytkowania.",
    dataSecurityTitle: "10. Bezpieczeństwo danych",
    dataSecurityText: "Chociaż nie zbieramy danych osobowych, stosujemy odpowiednie środki techniczne, aby zapewnić bezpieczeństwo wszelkich transmisji danych i gwarantujemy, że rozszerzenie działa bezpiecznie w ramach modelu bezpieczeństwa przeglądarki.",
    contactTitle: "11. Informacje kontaktowe",
    contactText: "Jeśli masz pytania lub uwagi dotyczące tej polityki prywatności:",
    responseTime: "Czas odpowiedzi: Staramy się odpowiadać w ciągu 72 godzin.",
    service: "Usługa:",
    purpose: "Cel:"
  },
  DE: {
    title: "Datenschutzrichtlinie",
    lastUpdate: "Letzte Aktualisierung: 27. Januar 2026",
    overview: "1. Übersicht",
    overviewTitle: "FACEITracker",
    overviewDescription: "ist eine Browser-Erweiterung zur Echtzeit-Verfolgung von Aktivitäten und Statistiken von CS2-Spielern auf der FACEIT-Plattform. Die Erweiterung liefert aktuelle Match- und Spielerdaten ohne Authentifizierung.",
    featuresTitle: "Hauptfunktionen:",
    features: [
      "Echtzeit-Verfolgung von Match-Starts für ausgewählte Spieler",
      "Automatische Hintergrund-Aktualisierung von Spieler- und Match-Status",
      "Anzeige von aktuellem ELO und FACEIT-Level (1–10)",
      "Ansicht der letzten Match-Historie mit Sieg-/Niederlagenergebnissen",
      "Detaillierte Spielerinformationen auf Profilkarten (Avatar, Bewertung, Level)",
      "Hervorhebung von Spielern auf der schwarzen Liste in Matches mit benutzerdefinierten Notizen",
      "Schneller Zugriff auf Statistiken ohne Navigation zu Profilseiten",
      "Unterstützung für EN, RU, UA, PL, DE"
    ],
    policyExplanation: "Diese Richtlinie erklärt, wie die Erweiterung Daten bei der Bereitstellung dieser Funktionen verarbeitet.",
    keyPoint: "Kernpunkt",
    keyPointText: "Diese Erweiterung sammelt, speichert oder verarbeitet keine persönlichen Informationen wie Namen, E-Mail-Adressen, Browserverlauf, Passwörter oder persönliche Dateien.",
    dataNotCollectedTitle: "2. Daten, die wir NICHT sammeln",
    dataNotCollected: [
      "Persönliche Identifikationsinformationen (Namen, E-Mail-Adressen, Telefonnummern)",
      "Browserverlauf oder Website-Besuche",
      "Passwörter oder Anmeldedaten",
      "Persönliche Dateien oder Dokumente",
      "Standortdaten, außer automatisch in HTTP-Anfragen enthaltene"
    ],
    externalServicesTitle: "3. Kommunikation mit externen Diensten",
    analyticsServer: "3.1. Entwickler-Analyseserver",
    analyticsService: "api.faceitracker.net",
    analyticsPurpose: "Dienst zur Erfassung und Verarbeitung anonymer Analysen, z.B. Zählung aktiver Benutzer und Online-Überwachung",
    faceitApi: "3.2. Öffentliche FACEIT API",
    faceitService: "open.faceit.com",
    faceitPurpose: "Zugriff auf öffentliche Match- und Spielerstatistiken für Analyse und Anzeige von Spielinformationen",
    technicalInfoTitle: "4. Automatische technische Informationen",
    technicalInfoDescription: "Wie bei allen Internetverbindungen können HTTP-Anfragen automatisch technische Standardinformationen enthalten wie:",
    technicalInfoItems: [
      "IP-Adresse (erforderlich für Internetverbindung)",
      "Browser User-Agent String",
      "Grundlegende Anfrage-Header"
    ],
    technicalInfoImportant: "Diese technischen Informationen können vorübergehend in Server-Logs für technische Zwecke und Dienstzuverlässigkeit gespeichert werden. Sie werden nicht zur Benutzeridentifikation verwendet und nicht an Dritte weitergegeben.",
    localStorageTitle: "5. Lokale Datenspeicherung",
    localStorageDescription: "Die Erweiterung kann vorübergehend Daten lokal in Ihrem Browser speichern, um die Leistung zu optimieren, einschließlich:",
    localStorageItems: [
      "Zwischengespeicherte FACEIT-Statistiken (temporär, automatisch gelöscht)",
      "Erweiterungseinstellungen und Präferenzen"
    ],
    localStorageNote: "Diese Daten verbleiben auf Ihrem Gerät und werden nicht an externe Server übertragen.",
    yourRightsTitle: "6. Ihre Rechte und Wahlmöglichkeiten",
    deletion: "Löschung:",
    deletionText: "Sie können die Erweiterung jederzeit über die Erweiterungsverwaltungsseite Ihres Browsers entfernen",
    dataClear: "Datenbereinigung:",
    dataClearText: "Das Entfernen der Erweiterung löscht alle lokal gespeicherten Daten",
    optOut: "Opt-out:",
    optOutText: "Entfernen Sie einfach die Erweiterung, um die gesamte Datenverarbeitung zu stoppen",
    thirdPartyTitle: "7. Drittanbieter-Dienste",
    thirdPartyText: "Diese Erweiterung verwendet die öffentliche FACEIT API. Bitte lesen Sie die Datenschutzrichtlinie von FACEIT für Informationen über deren Datenverarbeitungspraktiken.",
    policyChangesTitle: "8. Änderungen dieser Richtlinie",
    policyChangesText: "Wir können diese Datenschutzrichtlinie regelmäßig aktualisieren. Alle Änderungen werden durch Aktualisierung des Datums \"Letzte Aktualisierung\" oben auf dieser Seite widergespiegelt. Die fortgesetzte Nutzung der Erweiterung nach Änderungen bedeutet die Akzeptanz der aktualisierten Richtlinie.",
    legalBasisTitle: "9. Rechtsgrundlage (für EU-Benutzer)",
    legalBasisText: "Für Benutzer in der Europäischen Union ist unsere Rechtsgrundlage für die Datenverarbeitung das berechtigte Interesse an der Bereitstellung der Erweiterungsfunktionalität und der anonymen Messung von Nutzungsstatistiken.",
    dataSecurityTitle: "10. Datensicherheit",
    dataSecurityText: "Obwohl wir keine persönlichen Daten sammeln, wenden wir angemessene technische Maßnahmen an, um die Sicherheit jeglicher Datenübertragungen zu gewährleisten, und garantieren, dass die Erweiterung sicher innerhalb des Sicherheitsmodells Ihres Browsers funktioniert.",
    contactTitle: "11. Kontaktinformationen",
    contactText: "Wenn Sie Fragen oder Anmerkungen zu dieser Datenschutzrichtlinie haben:",
    responseTime: "Antwortzeit: Wir bemühen uns, innerhalb von 72 Stunden zu antworten.",
    service: "Dienst:",
    purpose: "Zweck:"
  }
};

const languageNames: Record<Language, string> = {
  RU: "Русский",
  EN: "English",
  UA: "Українська",
  PL: "Polski",
  DE: "Deutsch"
};

export default function PrivacyPage() {
  const [init, setInit] = useState(false);
  const [language, setLanguage] = useState<Language>("RU");

  const t = translations[language];

  React.useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container?: Container) => {
    // console.log(container);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 relative overflow-hidden">
      {/* Dynamic Background - Floating Stars */}
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          className="absolute inset-0 z-0"
          options={{
            background: {
              color: {
                value: "transparent",
              },
            },
            fpsLimit: 60,
            particles: {
              color: {
                value: ["#ffffff", "#ff6b00", "#ffaa00"],
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "out",
                },
                random: true,
                speed: 0.3,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                },
                value: 100,
              },
              opacity: {
                value: { min: 0.1, max: 0.6 },
                animation: {
                  enable: true,
                  speed: 0.5,
                  sync: false,
                },
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 0.5, max: 2 },
              },
            },
            detectRetina: true,
          }}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img src="/icons/Faceitlogo128.png" alt="FACEITracker" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xl tracking-wide">FACEITracker</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Онлайн: 10189</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 text-sm font-medium border border-white/10 rounded-md px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors"
                  data-testid="language-switcher"
                >
                  <span>{languageNames[language]}</span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-white/10">
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <DropdownMenuItem 
                    key={lang} 
                    onClick={() => setLanguage(lang)}
                    className={`cursor-pointer ${language === lang ? 'text-primary' : ''}`}
                    data-testid={`language-option-${lang}`}
                  >
                    {languageNames[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl relative z-10">
        
        {/* Title Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            {t.lastUpdate}
          </p>
        </div>

        {/* Content Card */}
        <Card className="border-white/5 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
          <CardContent className="p-8 md:p-12 space-y-12">
            
            {/* Section 1: Overview */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Info className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{t.overview}</h2>
              </div>
              
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  <strong className="text-white">{t.overviewTitle}</strong> {t.overviewDescription}
                </p>
                
                <p className="text-white font-medium pt-2">{t.featuresTitle}</p>

                <ul className="grid gap-3">
                  {t.features.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-400">
                      <Zap className="w-4 h-4 text-primary/60 shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <p className="pt-2">
                  {t.policyExplanation}
                </p>
              </div>

              {/* Key Point Box */}
              <div className="mt-8 rounded-lg border-l-4 border-primary bg-primary/5 p-6">
                <h3 className="text-primary font-bold mb-2 text-sm uppercase tracking-wider">{t.keyPoint}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {t.keyPointText}
                </p>
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Section 2: Data Not Collected */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Shield className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{t.dataNotCollectedTitle}</h2>
              </div>
              
              <ul className="space-y-3 pl-2 text-gray-300">
                {t.dataNotCollected.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-500/70 shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator className="bg-white/5" />

            {/* Section 3: External Services */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <ExternalLink className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{t.externalServicesTitle}</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-lg bg-white/5 p-6 border border-white/5">
                  <h3 className="text-white font-semibold mb-3">{t.analyticsServer}</h3>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p><span className="text-primary/70">{t.service}</span> {t.analyticsService}</p>
                    <p><span className="text-primary/70">{t.purpose}</span> {t.analyticsPurpose}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 p-6 border border-white/5">
                  <h3 className="text-white font-semibold mb-3">{t.faceitApi}</h3>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p><span className="text-primary/70">{t.service}</span> {t.faceitService}</p>
                    <p><span className="text-primary/70">{t.purpose}</span> {t.faceitPurpose}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Section 4: Technical Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Activity className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{t.technicalInfoTitle}</h2>
              </div>
              <p className="text-gray-300">{t.technicalInfoDescription}</p>
              <ul className="space-y-2 pl-4 list-disc text-gray-400 marker:text-primary/50">
                {t.technicalInfoItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <div className="rounded-lg bg-white/5 p-4 text-sm text-gray-400 border border-white/5">
                <span className="text-primary font-semibold">{language === "EN" ? "Important:" : language === "DE" ? "Wichtig:" : language === "PL" ? "Ważne:" : language === "UA" ? "Важливо:" : "Важно:"}</span> {t.technicalInfoImportant}
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Section 5: Local Storage */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <HardDrive className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{t.localStorageTitle}</h2>
              </div>
              <p className="text-gray-300">{t.localStorageDescription}</p>
              <ul className="space-y-2 pl-4 list-disc text-gray-400 marker:text-primary/50">
                {t.localStorageItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-300">{t.localStorageNote}</p>
            </div>

            <Separator className="bg-white/5" />

            {/* Section 6: Your Rights */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <UserCheck className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{t.yourRightsTitle}</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <p><strong className="text-white">{t.deletion}</strong> {t.deletionText}</p>
                <p><strong className="text-white">{t.dataClear}</strong> {t.dataClearText}</p>
                <p><strong className="text-white">{t.optOut}</strong> {t.optOutText}</p>
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Section 7: Third Party Services */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Globe className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{t.thirdPartyTitle}</h2>
              </div>
              <p className="text-gray-300">{t.thirdPartyText}</p>
            </div>

            <Separator className="bg-white/5" />

            {/* Sections 8, 9, 10, 11 */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">{t.policyChangesTitle}</h2>
                <p className="text-gray-300">{t.policyChangesText}</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">{t.legalBasisTitle}</h2>
                <p className="text-gray-300">{t.legalBasisText}</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">{t.dataSecurityTitle}</h2>
                <p className="text-gray-300">{t.dataSecurityText}</p>
              </div>
              
              <div className="rounded-xl bg-white/5 p-8 border border-white/5 text-center">
                <h2 className="text-2xl font-bold text-primary mb-6 flex items-center justify-center gap-2">
                  <Mail className="w-6 h-6" />
                  {t.contactTitle}
                </h2>
                <p className="text-gray-300 mb-4">{t.contactText}</p>
                <a href="mailto:hohondima3@gmail.com" className="text-xl font-bold text-white hover:text-primary transition-colors">hohondima3@gmail.com</a>
                <p className="text-sm text-gray-500 mt-4">{t.responseTime}</p>
              </div>
            </div>

          </CardContent>
        </Card>
        
        {/* Footer Ambient Effect */}
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      </main>
    </div>
  );
}
