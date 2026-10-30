import React, { cloneElement, createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert as NativeAlert,
  Text as NativeText,
  TextInput as NativeTextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'parkshare-language';
const LanguageContext = createContext({
  language: 'el',
  ready: false,
  setLanguage: async () => {},
});

const translations = {
  'el': {},
  'en': {
    'Φόρτωση...': 'Loading...',
    'Λίστα': 'List',
    'Χάρτης': 'Map',
    'Προσθήκη': 'Add a spot',
    'Οι Θέσεις μου': 'My spots',
    'Σύνδεση Stripe': 'Stripe setup',
    'Ειδοποιήσεις': 'Notifications',
    'Προφίλ': 'Profile',
    'Οδηγός Ιδιοκτήτη': 'Owner guide',
    'Κράτηση': 'Booking',
    'Εγγραφή': 'Sign up',
    'Πολιτική Απορρήτου': 'Privacy Policy',
    'Σφάλμα': 'Error',
    'Επιτυχία!': 'Success!',
    'Επιτυχία': 'Success',
    'Email': 'Email',
    'Κωδικός': 'Password',
    'Σύνδεση': 'Log in',
    'Συνδεθείτε για να συνεχίσετε': 'Log in to continue',
    'Δεν έχετε λογαριασμό;': "Don't have an account?",
    'Έχετε ήδη λογαριασμό;': 'Already have an account?',
    'Εμφάνιση κωδικού': 'Show password',
    'Απόκρυψη κωδικού': 'Hide password',
    'Συμπληρώστε email και κωδικό.': 'Enter your email and password.',
    'Παρουσιάστηκε σφάλμα.': 'Something went wrong.',
    'Δεν βρέθηκε χρήστης με αυτό το email.': 'No user was found with this email address.',
    'Λάθος κωδικός.': 'Incorrect password.',
    'Μη έγκυρο email.': 'Invalid email address.',
    'Λάθος email ή κωδικός.': 'Incorrect email or password.',
    'Δημιουργήστε νέο λογαριασμό': 'Create a new account',
    'Συμπληρώστε όλα τα πεδία.': 'Complete all fields.',
    'Οι κωδικοί δεν ταιριάζουν.': 'The passwords do not match.',
    'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.': 'The password must be at least 6 characters.',
    'Πρέπει να αποδεχτείτε την Πολιτική Απορρήτου.': 'You must accept the Privacy Policy.',
    'Ο λογαριασμός σας δημιουργήθηκε.': 'Your account has been created.',
    'Το email χρησιμοποιείται ήδη.': 'This email address is already in use.',
    'Ο κωδικός είναι πολύ αδύναμος.': 'The password is too weak.',
    'Επιβεβαίωση Κωδικού': 'Confirm password',
    'Επιλέξτε Ρόλο': 'Choose a role',
    'Οδηγός': 'Driver',
    'Ιδιοκτήτης': 'Owner',
    'Αποδέχομαι την': 'I accept the',
    'Πολιτική Απορρήτου': 'Privacy Policy',
    'τουλάχιστον 6 χαρακτήρες': 'at least 6 characters',
    'Καλώς ήρθατε': 'Welcome',
    'Νέα Θέση': 'New spot',
    'Τίτλος *': 'Title *',
    'Κωδικός Θέσης *': 'Spot code *',
    'Διεύθυνση *': 'Address *',
    'Τιμή (€/ώρα) *': 'Price (€/hour) *',
    'Πόλη *': 'City *',
    'Ώρες διαθεσιμότητας': 'Available hours',
    'Αποθήκευση Θέσης': 'Save spot',
    'Αποθήκευση': 'Save',
    'Αποθήκευση...': 'Saving...',
    'Ακύρωση': 'Cancel',
    'Κλείσιμο': 'Close',
    'Επέλεξε Πόλη': 'Choose a city',
    'Συμπληρώστε τίτλο, κωδικό και τιμή.': 'Enter a title, spot code, and price.',
    'Η ελάχιστη τιμή είναι 2,00 € ανά ώρα.': 'The minimum price is €2.00 per hour.',
    'Η θέση αποθηκεύτηκε.': 'Spot saved.',
    'Δεν μπόρεσε να αποθηκευτεί η θέση.': 'Could not save the spot.',
    'π.χ. Πυλωτή Αριστοτέλους': 'e.g. Aristotelous covered parking',
    'π.χ. Αριστοτέλους 12, Θεσσαλονίκη': 'e.g. 12 Aristotelous St, Thessaloniki',
    'π.χ. Θεσσαλονίκη': 'e.g. Thessaloniki',
    'π.χ. 10:00 - 18:00': 'e.g. 10:00 - 18:00',
    'Δεν υπάρχει σύνδεση στο διαδίκτυο. Προβολή σε offline mode.': 'No internet connection. Showing offline data.',
    'Δεν υπάρχει σύνδεση στο διαδίκτυο.': 'No internet connection.',
    'Δεν μπόρεσε να φορτωθούν οι θέσεις.': 'Could not load spots.',
    'Η θέση είναι κλεισμένη για σήμερα.': 'This spot is booked for today.',
    'Δεν μπόρεσε να ανοίξει η πλοήγηση.': 'Could not open navigation.',
    'ΚΛΕΙΣΜΕΝΗ': 'BOOKED',
    'Κλεισμένη': 'Booked',
    'Κλεισμένη για σήμερα': 'Booked for today',
    'Αξιολόγησε τη θέση': 'Rate this spot',
    'Δεν έχει κωδικό': 'No code',
    'Δεν έχει': 'Not available',
    'Οδήγηση': 'Directions',
    'Κράτηση': 'Book',
    'Αναζήτηση...': 'Search...',
    'Τιμή': 'Price',
    'Απόσταση': 'Distance',
    'Διαθέσιμες': 'Available',
    'Δεν βρέθηκαν θέσεις': 'No spots found',
    'Τιμή από': 'Price from',
    '€/ώρα': '€/hour',
    'Θέση': 'Spot',
    'Θέση στον χάρτη, ': 'Spot on map, ',
    'Η άδεια τοποθεσίας απορρίφθηκε': 'Location permission was denied.',
    'Δεν μπόρεσε να βρει την τοποθεσία σας': 'Could not find your location.',
    'Τίτλος': 'Title',
    'Κωδικός': 'Code',
    'Τιμή': 'Price',
    'Ώρες': 'Hours',
    'Συντεταγμένες: ': 'Coordinates: ',
    'Κράτηση Θέσης': 'Book a spot',
    'Ημερομηνία': 'Date',
    'Ώρα έναρξης': 'Start time',
    'Διάρκεια (ώρες)': 'Duration (hours)',
    'Η ελάχιστη διάρκεια κράτησης είναι 2 ώρες.': 'The minimum booking duration is 2 hours.',
    'Αριθμός κυκλοφορίας *': 'License plate *',
    'Σύνολο': 'Total',
    'Προμήθεια ParkShare': 'ParkShare fee',
    'Μεταφορά στον ιδιοκτήτη': 'Payout to owner',
    'Πληρωμή...': 'Paying...',
    'Πληρωμή με Stripe': 'Pay with Stripe',
    'Σφάλμα πληρωμής': 'Payment error',
    'Συμπληρώστε τον αριθμό κυκλοφορίας.': 'Enter your license plate.',
    'Δεν βρέθηκε το ID της θέσης. Επιλέξτε ξανά τη θέση.': 'Spot ID not found. Please select the spot again.',
    'Δεν δημιουργήθηκε το payment intent': 'Could not create the payment intent.',
    '✅ Κράτηση & Πληρωμή Ολοκληρώθηκαν!': '✅ Booking and payment complete!',
    'Εντάξει': 'OK',
    'Δεν μπόρεσε να ολοκληρωθεί η κράτηση.': 'Could not complete the booking.',
    'Ακύρωση': 'Cancel',
    'Είστε σίγουροι ότι θέλετε να ακυρώσετε την κράτηση;': 'Are you sure you want to cancel this booking?',
    'Όχι': 'No',
    'Ναι, ακύρωση': 'Yes, cancel',
    'Ειδοποιήσεις': 'Notifications',
    'Ενεργοποίηση Push': 'Enable push notifications',
    'Λάβετε ειδοποιήσεις για νέες κρατήσεις, πληρωμές και υπενθυμίσεις.': 'Get notifications about new bookings, payments, and reminders.',
    'Push Token': 'Push token',
    '🧪 Δοκιμαστική Ειδοποίηση': '🧪 Test notification',
    '📋 Τι ειδοποιήσεις θα λαμβάνετε:': '📋 Notifications you may receive:',
    '• 🔔 Νέα κράτηση στη θέση σου': '• 🔔 New booking for your spot',
    '• ✅ Επιβεβαίωση πληρωμής': '• ✅ Payment confirmation',
    '• ⏰ Υπενθύμιση λήξης κράτησης': '• ⏰ Booking end reminder',
    '• 💰 Μεταφορά χρημάτων': '• 💰 Payout',
    '• ❌ Ακύρωση κράτησης': '• ❌ Booking cancellation',
    '• ⭐ Νέα αξιολόγηση': '• ⭐ New review',
    '✅ Ενεργοποιήθηκαν': '✅ Enabled',
    'Θα λαμβάνετε ειδοποιήσεις.': 'You will receive notifications.',
    '⚠️ Σφάλμα': '⚠️ Error',
    'Δεν μπόρεσε να ενεργοποιηθεί. Ελέγξτε το τερματικό για logs.': 'Could not enable notifications. Check the app logs for details.',
    '❌ Απενεργοποιήθηκαν': '❌ Disabled',
    'Δεν θα λαμβάνετε ειδοποιήσεις.': 'You will no longer receive notifications.',
    'Δοκιμαστική ειδοποίηση!': 'Test notification!',
    'Αποσύνδεση': 'Log out',
    'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;': 'Are you sure you want to log out?',
    'Δεν μπόρεσε να αποσυνδεθεί.': 'Could not log out.',
    'Δεν μπόρεσε να σταλεί η ειδοποίηση.': 'Could not send the notification.',
    'Δεν υπάρχει': 'Not available',
    'Έκδοση 1.0.0': 'Version 1.0.0',
    'Γλώσσα': 'Language',
    'Ελληνικά': 'Greek',
    'English': 'English',
    'Πληρωμή': 'Payment',
    'Άγνωστη': 'Unknown',
    'ώρα(ες)': 'hour(s)',
    '✅ Ιδιοκτήτης συνδεδεμένος': '✅ Owner connected',
    '⚠️ Ο ιδιοκτήτης δεν έχει συνδέσει Stripe': '⚠️ The owner has not connected Stripe',
    'Δεν μπόρεσε να ξεκινήσει η πληρωμή.': 'Could not start the payment.',
    'Σφάλμα Πληρωμής': 'Payment error',
    '✅ Επιτυχία!': '✅ Success!',
    'Η πληρωμή ολοκληρώθηκε. Αποθηκεύεται η κράτηση...': 'Payment complete. Saving your booking...',
    'Κάτι πήγε λάθος με την πληρωμή.': 'Something went wrong with the payment.',
    'Σύνδεση Stripe': 'Stripe setup',
    'Η Stripe θα διαχειρίζεται τις πληρωμές και θα μεταφέρει τα χρήματα': 'Stripe will process payments and transfer the funds',
    'στον λογαριασμό σου μετά την ολοκλήρωση κράτησης.': 'to your account after the booking is complete.',
    'Η Stripe θα διαχειρίζεται τις πληρωμές και θα μεταφέρει τα χρήματα στον λογαριασμό σου μετά την ολοκλήρωση κράτησης.': 'Stripe will process payments and transfer the funds to your account after the booking is complete.',
    'Marketplace flow': 'How payments work',
    '1. Ο οδηγός πληρώνει στην εφαρμογή': '1. The driver pays in the app',
    '2. Η Stripe κρατά τα χρήματα': '2. Stripe holds the funds',
    '3. Η Stripe μεταφέρει το ποσό στον ιδιοκτήτη': '3. Stripe transfers the funds to the owner',
    '4. Η πλατφόρμα κρατά προμήθεια 20%': '4. The platform charges a 20% fee',
    'Σύνδεση Stripe για λήψη πληρωμών από κλειστές κρατήσεις.': 'Connect Stripe to receive payments for bookings.',
    'Σύνδεση με Stripe': 'Connect with Stripe',
    'Πρέπει να είστε συνδεδεμένοι.': 'You must be logged in.',
    'Δημιουργώ τον Stripe λογαριασμό σου...': 'Creating your Stripe account...',
    'Ανοίγω τη σελίδα της Stripe...': 'Opening the Stripe page...',
    'Ο λογαριασμός Stripe δημιουργήθηκε.': 'Your Stripe account has been created.',
    'Σφάλμα Stripe': 'Stripe error',
    'Δεν μπόρεσε να συνδεθεί.': 'Could not connect.',
    'Δεν βρέθηκε η θέση.': 'Spot not found.',
    'Ο οδηγός σκανάρει αυτόν τον κωδικό κατά την άφιξη.': 'The driver scans this code on arrival.',
    'Κωδικός: ': 'Code: ',
    'Ο κωδικός είναι μοναδικός για τη συγκεκριμένη θέση.': 'This code is unique to this spot.',
    'Χρειάζεται πρόσβαση στην κάμερα': 'Camera access is required',
    'Χρησιμοποιείται μόνο για τη σάρωση του QR check-in.': 'The camera is only used to scan the check-in QR code.',
    'Παραχώρηση πρόσβασης': 'Grant access',
    'Επιβεβαίωση άφιξης...': 'Confirming arrival...',
    'Στοχεύστε στο QR της θέσης': 'Point the camera at the spot QR code',
    'Σάρωση ξανά': 'Scan again',
    'Μη έγκυρος κωδικός ParkShare.': 'Invalid ParkShare code.',
    'Πρέπει να συνδεθείτε για check-in.': 'You must log in to check in.',
    'Δεν βρέθηκε ενεργή κράτηση για αυτή τη θέση.': 'No active booking was found for this spot.',
    'Η άφιξή σας επιβεβαιώθηκε.': 'Your arrival has been confirmed.',
    'Αποτυχία check-in': 'Check-in failed',
    'Δεν ήταν δυνατή η επιβεβαίωση.': 'Could not confirm check-in.',
    'Δοκιμή ξανά': 'Try again',
    'QR Check-in': 'QR check-in',
    'Κωδικός:': 'Code:',
    'Αξιολόγηση θέσης': 'Rate this spot',
    'Η βαθμολογία σας': 'Your rating',
    'Επιλέξτε βαθμολογία από 1 έως 5 αστέρια.': 'Choose a rating from 1 to 5 stars.',
    'Το σχόλιο δεν μπορεί να ξεπερνά τους 500 χαρακτήρες.': 'Your comment cannot exceed 500 characters.',
    'Πείτε μας την εμπειρία σας (προαιρετικό)': 'Tell us about your experience (optional)',
    'Υποβολή αξιολόγησης': 'Submit review',
    'Αξιολογήσεις': 'Reviews',
    'Δεν υπάρχουν ακόμη αξιολογήσεις.': 'There are no reviews yet.',
    'Επισκέπτης': 'Guest',
    'Δεν ήταν δυνατή η φόρτωση των αξιολογήσεων.': 'Could not load reviews.',
    'Δεν ήταν δυνατή η αποθήκευση της αξιολόγησης.': 'Could not save your review.',
    'Ευχαριστούμε': 'Thank you',
    'Η αξιολόγησή σας αποθηκεύτηκε.': 'Your review has been saved.',
    'αστέρια': 'stars',
    'Δεν μπόρεσε να φορτώσει τις θέσεις σας.': 'Could not load your spots.',
    '🗑️ Διαγραφή Θέσης': '🗑️ Delete spot',
    'Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.': 'This action cannot be undone.',
    'Διαγραφή': 'Delete',
    '✅ Επιτυχία': '✅ Success',
    'Η θέση διαγράφηκε.': 'Spot deleted.',
    'Δεν μπόρεσε να διαγραφεί η θέση.': 'Could not delete the spot.',
    'Γράψε τις ώρες διαθεσιμότητας.': 'Enter the available hours.',
    'Η ώρα διαθεσιμότητας ενημερώθηκε.': 'Availability hours updated.',
    'Δεν μπόρεσε να ενημερωθεί η ώρα.': 'Could not update the hours.',
    '▣ Προβολή QR check-in': '▣ View check-in QR',
    '✏️ Αλλαγή Ώρας': '✏️ Change hours',
    '🏢 Οι Θέσεις μου': '🏢 My spots',
    'Δεν έχετε προσθέσει ακόμα θέσεις': 'You have not added any spots yet.',
    '✏️ Αλλαγή Ώρας Διαθεσιμότητας': '✏️ Change availability hours',
    'Ώρες (π.χ. 09:00 - 17:00)': 'Hours (e.g. 09:00 - 17:00)',
    'Πρέπει να επιλέξετε': 'Please choose',
    'Γλώσσα εφαρμογής': 'App language',
    'ΒΗΜΑ 1: ΠΡΟΣΘΗΚΗ ΘΕΣΗΣ': 'STEP 1: ADD A SPOT',
    'ΒΗΜΑ 2: ΣΥΝΔΕΣΗ ΜΕ STRIPE': 'STEP 2: CONNECT STRIPE',
    'ΒΗΜΑ 3: ΝΟΜΙΚΕΣ & ΦΟΡΟΛΟΓΙΚΕΣ ΥΠΟΧΡΕΩΣΕΙΣ': 'STEP 3: LEGAL & TAX OBLIGATIONS',
    'ΒΗΜΑ 4: ΔΙΑΧΕΙΡΙΣΗ ΘΕΣΗΣ': 'STEP 4: MANAGE YOUR SPOT',
    'ΒΗΜΑ 5: ΕΙΔΟΠΟΙΗΣΕΙΣ': 'STEP 5: NOTIFICATIONS',
    'ΓΙΑΤΙ ΝΑ ΕΠΙΛΕΞΕΙΣ ΤΟ PARKSHARE:': 'WHY CHOOSE PARKSHARE:',
    'ΕΠΙΚΟΙΝΩΝΙΑ:': 'CONTACT:',
    'ΟΔΗΓΟΣ ΙΔΙΟΚΤΗΤΗ - ParkShare': 'PARKSHARE OWNER GUIDE',
    'Καλώς ήρθες στο ParkShare! Αυτός ο οδηγός θα σε βοηθήσει να νοικιάσεις τη θέση στάθμευσής σου με ασφάλεια και χωρίς προβλήματα.': 'Welcome to ParkShare! This guide will help you rent out your parking spot safely and with ease.',
    '1. Άνοιξε την εφαρμογή και πήγαινε στο μενού "Προσθήκη".\n2. Πάτησε στον χάρτη στο σημείο που βρίσκεται η θέση σου.\n3. Συμπλήρωσε τα στοιχεία:\n   - Τίτλο (π.χ. "Πυλωτή Αριστοτέλους")\n   - Κωδικό θέσης (π.χ. "A12")\n   - Διεύθυνση\n   - Τιμή ανά ώρα (ελάχιστη 2.00 €/ώρα)\n   - Ώρες διαθεσιμότητας (π.χ. 09:00 - 17:00)\n   - Πόλη\n4. Πάτησε "Αποθήκευση Θέσης".': '1. Open the app and go to the "Add a spot" menu.\n2. Tap the map where your spot is located.\n3. Enter the details:\n   - Title (e.g. "Aristotelous covered parking")\n   - Spot code (e.g. "A12")\n   - Address\n   - Hourly price (minimum €2.00/hour)\n   - Availability hours (e.g. 09:00 - 17:00)\n   - City\n4. Tap "Save spot".',
    'Για να λαμβάνεις πληρωμές, πρέπει να συνδεθείς με το Stripe.\n1. Πήγαινε στο μενού "Σύνδεση Stripe".\n2. Πάτησε "Σύνδεση με Stripe".\n3. Συμπλήρωσε τα στοιχεία σου (ταυτότητα, IBAN, ΑΦΜ).\n4. Περίμενε έγκριση (1-2 μέρες).\n\nΣΗΜΑΝΤΙΚΟ: Η πλατφόρμα κρατά προμήθεια 20% από κάθε κράτηση.': 'To receive payments, connect your account to Stripe.\n1. Go to the "Stripe setup" menu.\n2. Tap "Connect with Stripe".\n3. Enter your details (identity, IBAN, tax number).\n4. Wait for approval (1–2 days).\n\nIMPORTANT: The platform charges a 20% fee on each booking.',
    'Για να μην έχεις νομικά ή φορολογικά προβλήματα, πρέπει να κάνεις τα εξής:\n\n1. ΕΓΓΡΑΦΗ ΣΤΟ ΜΗΤΡΩΟ ΑΚΙΝΗΤΩΝ ΒΡΑΧΥΧΡΟΝΙΑΣ ΔΙΑΜΟΝΗΣ (ΑΑΔΕ)\n   Πρέπει να δηλώσεις το ακίνητό σου στην ειδική εφαρμογή της ΑΑΔΕ και να λάβεις έναν Αριθμό Μητρώου Ακινήτου (ΑΜΑ).\n   ΧΩΡΙΣ ΑΥΤΟΝ ΤΟΝ ΑΡΙΘΜΟ, Η ΔΡΑΣΤΗΡΙΟΤΗΤΑ ΕΙΝΑΙ ΠΑΡΑΝΟΜΗ.\n\n2. ΥΠΟΒΟΛΗ ΔΗΛΩΣΗΣ ΒΡΑΧΥΧΡΟΝΙΑΣ ΔΙΑΜΟΝΗΣ\n   Για κάθε κράτηση, πρέπει να υποβάλεις μια «Δήλωση Βραχυχρόνιας Διαμονής» στην ΑΑΔΕ.\n   Η προθεσμία είναι μέχρι τις 20 του επόμενου μήνα από την αναχώρηση του πελάτη.\n\n3. ΕΝΑΡΞΗ ΕΠΙΧΕΙΡΗΜΑΤΙΚΗΣ ΔΡΑΣΤΗΡΙΟΤΗΤΑΣ (για 3+ ακίνητα)\n   Αν νοικιάζεις περισσότερα από 2 ακίνητα (π.χ. 3 διαμερίσματα ή 3 θέσεις στάθμευσης), τότε το εισόδημα θεωρείται επιχειρηματική δραστηριότητα.\n   Σε αυτή την περίπτωση, πρέπει να κάνεις έναρξη επαγγέλματος στην ΑΑΔΕ.\n\n4. ΑΠΟΔΟΣΗ ΤΟΥ ΤΕΛΟΥΣ ΑΝΘΕΚΤΙΚΟΤΗΤΑΣ ΣΤΗΝ ΚΛΙΜΑΤΙΚΗ ΚΡΙΣΗ\n   Για κάθε διανυκτέρευση, πρέπει να εισπράττεις ένα μικρό τέλος από τον πελάτη (π.χ. 1,50 € την ημέρα) και να το αποδίδεις στην εφορία μέσω ειδικής δήλωσης.\n\n5. ΔΗΛΩΣΗ ΤΟΥ ΕΙΣΟΔΗΜΑΤΟΣ\n   Το εισόδημα από το πάρκινγκ δηλώνεται στην ετήσια φορολογική δήλωση (Έντυπο Ε1/Ε2).\n   Αν έχεις κάνει έναρξη επαγγέλματος, χρησιμοποιείς και το Έντυπο Ε3.\n\nΣΥΣΤΑΣΗ: Για οποιαδήποτε αμφιβολία, συνιστάται να συμβουλευτείς λογιστή.': 'To avoid legal or tax issues, you should do the following:\n\n1. REGISTER THE PROPERTY FOR SHORT-TERM RENTALS (AADE)\n   Declare your property through the AADE application and obtain a Property Registry Number (AMA).\n   OPERATING WITHOUT THIS NUMBER IS ILLEGAL.\n\n2. SUBMIT A SHORT-TERM STAY DECLARATION\n   For each booking, submit a "Short-Term Stay Declaration" to AADE.\n   The deadline is the 20th of the month after the guest checks out.\n\n3. REGISTER A BUSINESS (for 3+ properties)\n   If you rent out more than two properties (e.g. three apartments or three parking spots), the income is considered business income.\n   In this case, you must register a business with AADE.\n\n4. PAY THE CLIMATE CRISIS RESILIENCE FEE\n   For each overnight stay, collect a small fee from the guest (e.g. €1.50 per day) and remit it to the tax authority through the required declaration.\n\n5. DECLARE YOUR INCOME\n   Parking income is reported on your annual tax return (forms E1/E2).\n   If you have registered a business, also use form E3.\n\nRECOMMENDATION: If in doubt, consult an accountant.',
    '- Στο μενού "Οι Θέσεις μου", μπορείς να δεις όλες τις θέσεις σου.\n- Πάτησε "Αλλαγή Ώρας" για να αλλάξεις τις ώρες διαθεσιμότητας.\n- Πάτησε "Διαγραφή" για να διαγράψεις μια θέση.\n- Πάτησε "Προβολή QR check-in" για να δεις το QR code της θέσης.': '- In "My spots", you can view all your spots.\n- Tap "Change hours" to update availability.\n- Tap "Delete" to remove a spot.\n- Tap "View check-in QR" to view the spot QR code.',
    '- Πήγαινε στο μενού "Ειδοποιήσεις" και ενεργοποίησε το Push.\n- Θα λαμβάνεις ειδοποιήσεις για:\n  - Νέα κράτηση\n  - Επιβεβαίωση πληρωμής\n  - Υπενθύμιση λήξης κράτησης\n  - Ακύρωση κράτησης\n  - Νέα αξιολόγηση': '- Go to "Notifications" and enable push notifications.\n- You will receive notifications about:\n  - New bookings\n  - Payment confirmations\n  - Booking end reminders\n  - Cancellations\n  - New reviews',
    '✅ Κρατάς το 80% των κερδών σου.\n✅ Εσύ αποφασίζεις πότε και πόσο νοικιάζεις.\n✅ Ασφαλείς πληρωμές μέσω Stripe.\n✅ Δεν χρειάζεται να ψάχνεις πελάτες — το ParkShare το κάνει για σένα.': '✅ Keep 80% of your earnings.\n✅ Choose when and how often to rent.\n✅ Secure payments through Stripe.\n✅ No need to find customers — ParkShare does it for you.',
    'Για ερωτήσεις: thandersok@gmail.com': 'For questions: thandersok@gmail.com',
    'Πολιτική Απορρήτου': 'Privacy Policy',
    'Τελευταία ενημέρωση: 15/09/2026': 'Last updated: 15/09/2026',
    '1. Ποιοι είμαστε': '1. Who we are',
    'Το ParkShare είναι υπηρεσία εύρεσης και κράτησης θέσεων στάθμευσης. Για απορίες σχετικά με τα προσωπικά δεδομένα σας, επικοινωνήστε με την ομάδα υποστήριξης μέσω των στοιχείων επικοινωνίας που εμφανίζονται στην εφαρμογή.': 'ParkShare is a service for finding and booking parking spaces. If you have questions about your personal data, contact our support team using the contact details shown in the app.',
    '2. Δεδομένα που συλλέγουμε': '2. Data we collect',
    'Κατά την εγγραφή αποθηκεύουμε email, ρόλο χρήστη και στοιχεία λογαριασμού. Για κρατήσεις αποθηκεύουμε τα στοιχεία της κράτησης, τον αριθμό κυκλοφορίας που καταχωρίζετε και τα στοιχεία check-in. Οι αξιολογήσεις αποθηκεύονται μαζί με το κείμενο, τη βαθμολογία, τη θέση και τον συντάκτη τους.': 'When you register, we store your email address, user role, and account details. For bookings, we store booking details, the license plate you provide, and check-in details. Reviews are stored with their text, rating, spot, and author.',
    '3. Γιατί τα χρησιμοποιούμε': '3. How we use your data',
    'Χρησιμοποιούμε τα δεδομένα για δημιουργία λογαριασμού, διαχείριση κρατήσεων, επιβεβαίωση άφιξης, εμφάνιση αξιολογήσεων και προστασία της υπηρεσίας από κατάχρηση. Δεν πουλάμε τα δεδομένα σας και δεν τα χρησιμοποιούμε για άσχετη διαφήμιση χωρίς ξεχωριστή συγκατάθεση.': 'We use your data to create accounts, manage bookings, confirm arrivals, display reviews, and protect the service from abuse. We do not sell your data or use it for unrelated advertising without separate consent.',
    '4. Αποθήκευση και ασφάλεια': '4. Storage and security',
    'Τα δεδομένα αποθηκεύονται στο Firebase/Firestore με ελεγχόμενη πρόσβαση. Διατηρούμε τα δεδομένα μόνο όσο είναι απαραίτητο για τους παραπάνω σκοπούς ή όσο απαιτείται από τον νόμο.': 'Data is stored in Firebase/Firestore with access controls. We retain data only as long as needed for the purposes above or as required by law.',
    '5. Τα δικαιώματά σας': '5. Your rights',
    'Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού και φορητότητας των δεδομένων σας, καθώς και δικαίωμα ανάκλησης της συγκατάθεσης. Για την άσκηση των δικαιωμάτων σας, επικοινωνήστε με την υποστήριξη του ParkShare.': 'You have the right to access, correct, erase, restrict, and port your data, as well as to withdraw your consent. To exercise your rights, contact ParkShare support.',
    '6. Αλλαγές στην πολιτική': '6. Changes to this policy',
    'Ενδέχεται να ενημερώνουμε την πολιτική όταν αλλάζουν η υπηρεσία ή οι νομικές απαιτήσεις. Η ισχύουσα έκδοση θα είναι πάντα διαθέσιμη μέσα στην εφαρμογή.': 'We may update this policy when the service or legal requirements change. The current version will always be available in the app.',
    'Αθήνα': 'Athens',
    'Θεσσαλονίκη': 'Thessaloniki',
    'Πάτρα': 'Patras',
    'Ηράκλειο': 'Heraklion',
    'Λάρισα': 'Larissa',
    'Βόλος': 'Volos',
    'Ιωάννινα': 'Ioannina',
    'Χανιά': 'Chania',
    'Ρόδος': 'Rhodes',
    'Αλεξανδρούπολη': 'Alexandroupoli',
    'Καβάλα': 'Kavala',
    'Σέρρες': 'Serres',
    'Καλαμάτα': 'Kalamata',
    'Τρίκαλα': 'Trikala',
    'Κέρκυρα': 'Corfu',
    'Ζάκυνθος': 'Zakynthos',
    'Γλώσσα εφαρμογής': 'App language',
    'Ονοματεπώνυμο': 'Full name',
    'Τηλέφωνο': 'Phone number',
    '🏢 Εγγραφή Ιδιοκτήτη': '🏢 Owner registration',
    'Έχετε ήδη λογαριασμό; Σύνδεση': 'Already have an account? Log in',
    '✅ Επιτυχία': '✅ Success',
    'Δεν ήταν δυνατή η φόρτωση των αξιολογήσεων.': 'Could not load reviews.',
    'Αποσύνδεση': 'Log out',
    'Πολιτική Απορρήτου': 'Privacy Policy',
    'Σύνδεση': 'Log in',
    'Ακύρωση κράτησης': 'Cancel booking',
    'Συμπληρώστε όλα τα πεδία.': 'Complete all fields.',
    'Δεν ήταν δυνατή η αποθήκευση της γλώσσας.': 'Could not save the language preference.',
    '🌐 Γλώσσα εφαρμογής': '🌐 App language',
    '👤 Προφίλ': '👤 Profile',
    '🔔 Ειδοποιήσεις': '🔔 Notifications',
    '📅 Κράτηση Θέσης': '📅 Book a spot',
    '📆 Ημερομηνία': '📆 Date',
    '⏰ Ώρα έναρξης': '⏰ Start time',
    '⏱️ Διάρκεια (ώρες)': '⏱️ Duration (hours)',
    '🚗 Αριθμός κυκλοφορίας *': '🚗 License plate *',
    '❌ Ακύρωση': '❌ Cancel',
    '📝 Εγγραφή': '📝 Sign up',
    '🚗 Οδηγός': '🚗 Driver',
    '🏢 Ιδιοκτήτης': '🏢 Owner',
    '🔴 ΚΛΕΙΣΜΕΝΗ': '🔴 BOOKED',
    '🔴 Κλεισμένη': '🔴 Booked',
    '📅 Κράτηση': '📅 Book',
    '🧭 Οδήγηση': '🧭 Directions',
    '🔴 Κλεισμένη Θέση': '🔴 Spot booked',
    'Η θέση είναι ήδη κλεισμένη για σήμερα.': 'This spot is already booked for today.',
    'Τίτλος': 'Title',
    'Κωδικός': 'Code',
    'Κωδικός:': 'Code:',
    '🏢 Οι Θέσεις μου': '🏢 My spots',
    '🗑️ Διαγραφή': '🗑️ Delete',
    '🏷️ Τίτλος': '🏷️ Title',
    '🔑 Κωδικός': '🔑 Code',
    '💰 Τιμή': '💰 Price',
    '🕐 Ώρες': '🕐 Hours',
    '🚪 Αποσύνδεση': '🚪 Log out',
    'Αξιολογήσεις (': 'Reviews (',
    ' ώρα(ες)': ' hour(s)',
    'π.χ. A12, B3, 105': 'e.g. A12, B3, 105',
    'π.χ. 2': 'e.g. 2',
    'π.χ. ΝΚΑ-1234': 'e.g. ABC-1234',
    '•••••••• (τουλάχιστον 6 χαρακτήρες)': '•••••••• (at least 6 characters)',
    '📍 Νέα Θέση': '📍 New spot',
    '💾 Αποθήκευση': '💾 Save',
    '💳 Πληρωμή': '💳 Payment',
    '💳 Πληρωμή με Stripe': '💳 Pay with Stripe',
    '⏳ Πληρωμή...': '⏳ Paying...',
    '📍': '📍',
    '🌐 Γλώσσα εφαρμογής': '🌐 App language',
    'Δεν ήταν δυνατή η αποθήκευση της γλώσσας.': 'Could not save the language preference.',
    'Δοκιμαστική Ειδοποίηση': 'Test notification',
    'Η θέση είναι ήδη κλεισμένη για σήμερα.': 'This spot is already booked for today.',
    'Αυτή η θέση είναι ήδη κλεισμένη για σήμερα.': 'This spot is already booked for today.',
    '🔴 Κλεισμένη Θέση': '🔴 Spot booked',
    'Κωδικός Θέσης *': 'Spot code *',
    '💳 Πληρωμή ': '💳 Pay ',
    '🧪 Δοκιμαστική Ειδοποίηση': '🧪 Test notification',
    'Αλλαγή Ώρας': 'Change hours',
    '💾 Αποθήκευση': '💾 Save',
  },
};

const translate = (value, language) => {
  if (typeof value !== 'string' || language !== 'en') return value;
  const exact = translations.en[value];
  if (exact) return exact;
  const deleteConfirmation = value.match(/^Είσαι σίγουρος ότι θέλεις να διαγράψεις τη θέση "(.+)";\n\nΑυτή η ενέργεια δεν μπορεί να αναιρεθεί\.$/);
  if (deleteConfirmation) {
    return `Are you sure you want to delete the spot "${deleteConfirmation[1]}"?\n\nThis action cannot be undone.`;
  }
  const bookingConfirmation = value.match(/^Κρατήσατε τη θέση "(.+)" για (\d+) ώρα\/ες\.\nΠινακίδα: (.+)\nΣύνολο: (.+) €$/);
  if (bookingConfirmation) {
    return `You booked "${bookingConfirmation[1]}" for ${bookingConfirmation[2]} hour(s).\nLicense plate: ${bookingConfirmation[3]}\nTotal: €${bookingConfirmation[4]}`;
  }
  const ratingCount = value.match(/^Αξιολογήσεις \((\d+)\)$/);
  if (ratingCount) return `Reviews (${ratingCount[1]})`;
  const ratingLabel = value.match(/^(\d+) αστέρια$/);
  if (ratingLabel) return `${ratingLabel[1]} stars`;
  const hourCount = value.match(/^(.+) ώρα\(ες\)$/);
  if (hourCount) return `${hourCount[1]} hour(s)`;
  const spotAdded = value.match(/^Η θέση "(.+)" προστέθηκε!$/);
  if (spotAdded) return `Spot "${spotAdded[1]}" added!`;
  if (value.includes('€/ώρα')) return value.replace(/€\/ώρα/g, '€/hour');
  const paymentButton = value.match(/^💳 Πληρωμή (.+)$/);
  if (paymentButton) return `💳 Pay ${paymentButton[1]}`;
  return value;
};

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('el');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((savedLanguage) => {
        if (active && (savedLanguage === 'el' || savedLanguage === 'en')) {
          setLanguageState(savedLanguage);
        }
      })
      .catch((error) => {
        console.error('Could not load the saved app language:', error);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = async (nextLanguage) => {
    if (nextLanguage !== 'el' && nextLanguage !== 'en') {
      throw new Error(`Unsupported app language: ${nextLanguage}`);
    }
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    currentLanguage = nextLanguage;
    setLanguageState(nextLanguage);
  };

  const contextValue = useMemo(
    () => ({ language, ready, setLanguage }),
    [language, ready]
  );

  useEffect(() => {
    currentLanguage = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

function localizeChildren(children, language) {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') return translate(child, language);
    if (React.isValidElement(child) && child.props.children !== undefined) {
      return cloneElement(child, undefined, localizeChildren(child.props.children, language));
    }
    return child;
  });
}

export function Text({ children, accessibilityLabel, ...props }) {
  const { language } = useLanguage();
  return (
    <NativeText
      {...props}
      accessibilityLabel={translate(accessibilityLabel, language)}
    >
      {localizeChildren(children, language)}
    </NativeText>
  );
}

export const TextInput = React.forwardRef(function LocalizedTextInput(
  { placeholder, accessibilityLabel, ...props },
  ref
) {
  const { language } = useLanguage();
  return (
    <NativeTextInput
      ref={ref}
      {...props}
      placeholder={translate(placeholder, language)}
      accessibilityLabel={translate(accessibilityLabel, language)}
    />
  );
});

export const Alert = {
  alert(title, message, buttons, options) {
    const language = currentLanguage;
    NativeAlert.alert(
      translate(title, language),
      translate(message, language),
      buttons?.map((button) => ({
        ...button,
        text: translate(button.text, language),
      })),
      options
    );
  },
};

let currentLanguage = 'el';
