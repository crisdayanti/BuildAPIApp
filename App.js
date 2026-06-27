import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  View, Text, ActivityIndicator, FlatList, TextInput, 
  TouchableOpacity, StyleSheet, SafeAreaView, 
  Image, Modal, ScrollView, Animated, RefreshControl 
} from 'react-native';
import axios from 'axios';

const API_URL = 'https://fakestoreapi.com/products';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [category, setCategory] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(5);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    else setRefreshing(true);
    
    setError(null);
    try {
      const { data } = await axios.get(API_URL);
      setProducts(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } catch (err) {
      setError('Failed to load products. Check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const processedData = useMemo(() => {
    return products.filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || item.category === category)
    );
  }, [products, search, category]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.loadingText}>Loading Catalog...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => fetchData()}><Text style={{color:'#fff', fontWeight:'bold'}}>🔄 Retry</Text></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>ShopCatalog Ultra</Text>
      <TextInput style={styles.searchBar} placeholder="Search products..." value={search} onChangeText={setSearch} />
      
      <View style={styles.chipWrapper}>
        {['all', 'electronics', 'jewelery'].map(cat => (
          <TouchableOpacity key={cat} onPress={() => setCategory(cat)} 
            style={[styles.chip, category === cat && styles.chipActive]}>
            <Text style={category === cat ? styles.chipTextActive : styles.chipText}>
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={processedData.slice(0, displayLimit)}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
        onEndReached={() => setDisplayLimit(prev => prev + 5)}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity style={styles.card} onPress={() => setSelectedProduct(item)}>
              <Image source={{ uri: item.image }} style={styles.img} />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                <Text style={styles.price}>${item.price}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />

      <Modal visible={!!selectedProduct} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedProduct?.image }} style={styles.detailImg} />
              <Text style={styles.modalTitle}>{selectedProduct?.title}</Text>
              <Text style={styles.modalPrice}>Price: ${selectedProduct?.price}</Text>
              <Text style={styles.modalDescLabel}>Product Details:</Text>
              <Text style={styles.modalDesc}>{selectedProduct?.description}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProduct(null)}>
              <Text style={{color:'#fff', fontWeight:'bold'}}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 20 },
  header: { fontSize: 26, fontWeight: '800', margin: 20, color: '#1A1A1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  errorText: { color: '#e74c3c', marginBottom: 15 },
  searchBar: { marginHorizontal: 20, padding: 15, backgroundColor: '#FFF', borderRadius: 15, elevation: 3, marginBottom: 15 },
  chipWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 15 },
  chip: { flex: 1, paddingVertical: 12, backgroundColor: '#FFF', marginHorizontal: 5, borderRadius: 15, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  chipText: { color: '#333', fontWeight: '600', fontSize: 11 },
  chipTextActive: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, padding: 15, borderRadius: 20, marginBottom: 15, elevation: 3, alignItems: 'center' },
  img: { width: 70, height: 70, borderRadius: 15 },
  info: { marginLeft: 15, flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#333', lineHeight: 20 },
  price: { fontSize: 15, fontWeight: '800', color: '#4A90E2', marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 30, borderRadius: 25, maxHeight: '80%' },
  detailImg: { width: 150, height: 150, marginBottom: 20, alignSelf: 'center', resizeMode: 'contain' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalPrice: { fontSize: 22, color: '#4A90E2', marginVertical: 10, textAlign: 'center' },
  modalDescLabel: { fontSize: 14, fontWeight: 'bold', color: '#4A90E2', marginBottom: 5 },
  modalDesc: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20, textAlign: 'justify' },
  btn: { padding: 12, backgroundColor: '#4A90E2', borderRadius: 10 },
  closeBtn: { padding: 15, backgroundColor: '#4A90E2', borderRadius: 15, alignItems: 'center' }
});