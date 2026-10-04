import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import COLORS from '../theme/colors';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Πολιτική Απορρήτου</Text>
      <Text style={styles.updated}>Τελευταία ενημέρωση: 15/09/2026</Text>

      <Text style={styles.heading}>1. Ποιοι είμαστε</Text>
      <Text style={styles.body}>
        Το ParkShare είναι υπηρεσία εύρεσης και κράτησης θέσεων στάθμευσης. Για απορίες σχετικά με τα προσωπικά δεδομένα σας, επικοινωνήστε με την ομάδα υποστήριξης μέσω των στοιχείων επικοινωνίας που εμφανίζονται στην εφαρμογή.
      </Text>

      <Text style={styles.heading}>2. Δεδομένα που συλλέγουμε</Text>
      <Text style={styles.body}>
        Κατά την εγγραφή αποθηκεύουμε email, ρόλο χρήστη και στοιχεία λογαριασμού. Για κρατήσεις αποθηκεύουμε τα στοιχεία της κράτησης, τον αριθμό κυκλοφορίας που καταχωρίζετε και τα στοιχεία check-in. Οι αξιολογήσεις αποθηκεύονται μαζί με το κείμενο, τη βαθμολογία, τη θέση και τον συντάκτη τους.
      </Text>

      <Text style={styles.heading}>3. Γιατί τα χρησιμοποιούμε</Text>
      <Text style={styles.body}>
        Χρησιμοποιούμε τα δεδομένα για δημιουργία λογαριασμού, διαχείριση κρατήσεων, επιβεβαίωση άφιξης, εμφάνιση αξιολογήσεων και προστασία της υπηρεσίας από κατάχρηση. Δεν πουλάμε τα δεδομένα σας και δεν τα χρησιμοποιούμε για άσχετη διαφήμιση χωρίς ξεχωριστή συγκατάθεση.
      </Text>

      <Text style={styles.heading}>4. Αποθήκευση και ασφάλεια</Text>
      <Text style={styles.body}>
        Τα δεδομένα αποθηκεύονται στο Firebase/Firestore με ελεγχόμενη πρόσβαση. Διατηρούμε τα δεδομένα μόνο όσο είναι απαραίτητο για τους παραπάνω σκοπούς ή όσο απαιτείται από τον νόμο.
      </Text>

      <Text style={styles.heading}>5. Τα δικαιώματά σας</Text>
      <Text style={styles.body}>
        Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού και φορητότητας των δεδομένων σας, καθώς και δικαίωμα ανάκλησης της συγκατάθεσης. Για την άσκηση των δικαιωμάτων σας, επικοινωνήστε με την υποστήριξη του ParkShare.
      </Text>

      <Text style={styles.heading}>6. Αλλαγές στην πολιτική</Text>
      <Text style={styles.body}>
        Ενδέχεται να ενημερώνουμε την πολιτική όταν αλλάζουν η υπηρεσία ή οι νομικές απαιτήσεις. Η ισχύουσα έκδοση θα είναι πάντα διαθέσιμη μέσα στην εφαρμογή.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  updated: { color: '#666', marginBottom: 24 },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 18, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 23, color: '#444' },
});
