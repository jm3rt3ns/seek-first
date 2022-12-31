import React, { useCallback } from 'react';

// third party
import HomeScreen from './HomeScreen';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { getHeaderTitle } from '@react-navigation/elements';
import SelectBook from './SelectBook';
import { FOGWHITE, GREY } from './COLORS';
import { Provider } from 'react-redux';
import { store } from './store';
import SelectStartVerse, { VerseSelectionHeader } from './SelectStartVerse';
import SelectChapter, { ChapterSelectionHeader } from './SelectChapter';

// local

SplashScreen.preventAutoHideAsync();
const Stack = createNativeStackNavigator();

export const App = () => {

  const [fontsLoaded] = useFonts({
    'Inter-Light': require('./assets/fonts/Inter/static/Inter-Light.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter/static/Inter-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <View style={{ flex: 1, backgroundColor: FOGWHITE }} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <View style={{ flex: 1, backgroundColor: "#999999", borderRadius: 10 }}>
            <Stack.Navigator initialRouteName="Seek First" screenOptions={{
              headerStyle: { backgroundColor: GREY, borderBottomColor: GREY, borderBottomWidth: 1 },
              headerTitle: () => <></>,
              headerRight: () => <View><Image style={{ width: 100, height: 25, margin: 5 }} source={require('./assets/header_wordmark.png')} /></View>
            }}>
              <Stack.Screen name="Seek First" component={HomeScreen} />
              <Stack.Screen name="Select Book" component={SelectBook} options={{ presentation: "modal", headerShown: false }} />
              <Stack.Screen name="Select Chapter" component={SelectChapter} options={{ presentation: "modal", headerLeft: ChapterSelectionHeader }} />
              <Stack.Screen name="Select Start Verse" component={SelectStartVerse} options={{ presentation: "modal", headerLeft: VerseSelectionHeader }} />
            </Stack.Navigator>
          </View>
        </NavigationContainer>
      </View>
    </Provider>
  );
}

export default App;