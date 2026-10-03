/**
 * Hammer It! — a modern whack-a-hamster arcade game.
 *
 * @format
 */

import React, { useCallback, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Background } from './src/components/Background';
import type { EndReason, GameStats } from './src/game/useGameEngine';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { GameScreen } from './src/screens/GameScreen';
import { MenuScreen } from './src/screens/MenuScreen';

type Screen =
  | { name: 'menu' }
  | { name: 'game'; round: number }
  | { name: 'over'; stats: GameStats; reason: EndReason; isNewBest: boolean };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const [best, setBest] = useState(0);
  const [round, setRound] = useState(0);

  const play = useCallback(() => {
    setRound(r => r + 1);
    setScreen({ name: 'game', round: round + 1 });
  }, [round]);

  const menu = useCallback(() => setScreen({ name: 'menu' }), []);

  const gameOver = useCallback(
    (stats: GameStats, reason: EndReason) => {
      const isNewBest = stats.score > best;
      if (isNewBest) {
        setBest(stats.score);
      }
      setScreen({ name: 'over', stats, reason, isNewBest });
    },
    [best],
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        <Background />
        {screen.name === 'menu' && <MenuScreen best={best} onPlay={play} />}
        {screen.name === 'game' && (
          <GameScreen key={screen.round} onGameOver={gameOver} onQuit={menu} />
        )}
        {screen.name === 'over' && (
          <GameOverScreen
            stats={screen.stats}
            reason={screen.reason}
            best={best}
            isNewBest={screen.isNewBest}
            onPlayAgain={play}
            onMenu={menu}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
