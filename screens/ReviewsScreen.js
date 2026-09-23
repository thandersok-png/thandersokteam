import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../firebase';

const StarRating = ({ value, onChange, disabled = false }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onChange?.(star)} disabled={disabled} accessibilityLabel={`${star} αστέρια`}>
        <Text style={[styles.star, star <= value && styles.starSelected]}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function ReviewsScreen({ route }) {
  const { spot } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      if (!spot?.id) return;
      try {
        const snapshot = await getDocs(query(collection(db, 'reviews'), where('spotId', '==', spot.id)));
        setReviews(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch (error) {
        Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση των αξιολογήσεων.');
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, [spot?.id]);

  const submitReview = async () => {
    if (!spot?.id || rating < 1) {
      Alert.alert('Σφάλμα', 'Επιλέξτε βαθμολογία από 1 έως 5 αστέρια.');
      return;
    }
    if (comment.trim().length > 500) {
      Alert.alert('Σφάλμα', 'Το σχόλιο δεν μπορεί να ξεπερνά τους 500 χαρακτήρες.');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      const reviewRef = doc(collection(db, 'reviews'));
      const spotRef = doc(db, 'spots', spot.id);
      await runTransaction(db, async (transaction) => {
        const spotSnapshot = await transaction.get(spotRef);
        const current = spotSnapshot.exists() ? spotSnapshot.data() : {};
        const count = Number(current.ratingCount || 0);
        const average = Number(current.ratingAverage || 0);
        const nextCount = count + 1;
        const nextAverage = ((average * count) + rating) / nextCount;
        transaction.set(reviewRef, {
          spotId: spot.id,
          spotTitle: spot.title || '',
          userId: user.uid,
          userEmail: user.email || '',
          rating,
          comment: comment.trim(),
          createdAt: serverTimestamp(),
        });
        transaction.update(spotRef, { ratingCount: nextCount, ratingAverage: nextAverage });
      });
      setReviews((current) => [{ rating, comment: comment.trim(), userEmail: user.email || 'Επισκέπτης' }, ...current]);
      setRating(0);
      setComment('');
      Alert.alert('Ευχαριστούμε', 'Η αξιολόγησή σας αποθηκεύτηκε.');
    } catch (error) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αποθήκευση της αξιολόγησης.');
    } finally {
      setSaving(false);
    }
  };

  if (!spot?.id) return <View style={styles.center}><Text>Δεν βρέθηκε η θέση.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Αξιολόγηση θέσης</Text>
      <Text style={styles.spotTitle}>{spot.title}</Text>
      <Text style={styles.label}>Η βαθμολογία σας</Text>
      <StarRating value={rating} onChange={setRating} />
      <TextInput
        style={styles.input}
        placeholder="Πείτε μας την εμπειρία σας (προαιρετικό)"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />
      <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={submitReview} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Υποβολή αξιολόγησης</Text>}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Αξιολογήσεις ({reviews.length})</Text>
      {loading ? <ActivityIndicator color="#1a73e8" /> : reviews.length === 0 ? <Text style={styles.empty}>Δεν υπάρχουν ακόμη αξιολογήσεις.</Text> : reviews.map((review, index) => (
        <View style={styles.review} key={review.id || `${review.userEmail}-${index}`}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewUser}>{review.userEmail || 'Επισκέπτης'}</Text>
            <Text style={styles.reviewRating}>{'★'.repeat(Number(review.rating || 0))}</Text>
          </View>
          {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a73e8', marginBottom: 8 },
  spotTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 22 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  starsRow: { flexDirection: 'row', marginBottom: 18 },
  star: { fontSize: 42, color: '#d5d5d5', marginRight: 6 },
  starSelected: { color: '#f5b301' },
  input: { minHeight: 110, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, textAlignVertical: 'top', fontSize: 16 },
  button: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  disabled: { backgroundColor: '#999' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 30, marginBottom: 12 },
  empty: { color: '#666' },
  review: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  reviewUser: { flex: 1, fontWeight: '600', color: '#333' },
  reviewRating: { color: '#f5b301', fontSize: 16 },
  reviewComment: { color: '#555', marginTop: 8, lineHeight: 20 },
});
