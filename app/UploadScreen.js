import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Button, Image, Text, TextInput, View } from 'react-native';

export default function UploadScreen() {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
  fetch('https://iotapp-five.vercel.app/')
    .then(res => res.text())
    .then(text => console.log('Test backend:', text))
    .catch(err => console.error('Test backend error:', err));
}, []);


  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permisiuni galerie:', status);
      if (status !== 'granted') {
        Alert.alert(
          'Permisiune necesară',
          'Trebuie să permiți accesul la galerie pentru a selecta poze.'
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true, // ✔️ activează selecția multiplă
    });


      console.log('Rezultat ImagePicker:', result);
      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Eroare la selectare imagine:', err);
      Alert.alert('Eroare', 'Nu s-a putut selecta poza.');
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('Alege o poză mai întâi');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Scrie numele persoanei');
      return;
    }

    try {
      console.log('Încep uploadImage...');
      const uri = image.uri;
      console.log('URI imagine:', uri);

      const fileName = uri.split('/').pop();
      console.log('fileName:', fileName);

      const fileExtension = fileName.split('.').pop().toLowerCase();
      console.log('fileExtension:', fileExtension);

      const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
      };
      const fileType = mimeTypes[fileExtension] || 'image/jpeg';
      console.log('fileType:', fileType);

      const folderName = name.trim().replace(/\s+/g, '-');
      console.log('folderName:', folderName);

      console.log('Cerere generare URL pre-semnat...');
      const response = await fetch('https://iotapp-five.vercel.app/api/generate-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileType,
          folderName,
        }),
      });
      console.log('Răspuns generare URL:', response.status);

      if (!response.ok) throw new Error('Eroare la generarea URL-ului');

      const { url } = await response.json();
      console.log('URL pre-semnat primit:', url);

      console.log('Descărcare blob din URI...');
      const photoResponse = await fetch(uri);
      const blob = await photoResponse.blob();
      console.log('Blob primit, dimensiune:', blob.size);

      console.log('Încep upload către S3...');
      const upload = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': fileType,
        },
        body: blob,
      });
      console.log('Răspuns upload:', upload.status);

      const text = await upload.text();

      if (upload.ok) {
        Alert.alert('Succes', 'Poza a fost încărcată cu succes!');
        setImage(null);
        setName('');
      } else {
        console.error('Upload failed response:', text);
        throw new Error(`Upload eșuat: ${text}`);
      }
    } catch (err) {
      Alert.alert('Eroare', err.message || JSON.stringify(err));
      console.error('Upload error:', err);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text>Scrie numele persoanei:</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          width: '100%',
          marginVertical: 10,
          padding: 8,
          borderRadius: 5,
          color: '#000', // ← adăugat!
          backgroundColor: '#fff' // ← adăugat!
        }}
        value={name}
        onChangeText={setName}
        placeholder="Nume persoană"
        placeholderTextColor="#999"
      />

      <Button title="Alege o poză" onPress={pickImage} />
      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: 200, height: 200, marginVertical: 10, borderRadius: 10 }}
        />
      )}
      <Button title="Încarcă poza" onPress={uploadImage} />
    </View>
  );
}
