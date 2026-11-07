import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text as RNText, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import { fontFamily } from '../tokens/typography';
import { Hatch } from './Hatch';

export interface ProposalCardProps {
  /** Board text naming the source, e.g. "PROPOSED · FROM EMAIL". */
  eyebrow: string;
  /** Shows a lock + "ON-DEVICE" when the proposal was produced on this device. */
  onDevice?: boolean;
  children: ReactNode;
}

const useStyles = makeStyles((t) => ({
  card: {
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: t.color.proposal.border,
    borderRadius: t.radius.lg,
    paddingVertical: 10,
    paddingHorizontal: t.space[3],
    gap: t.space[2],
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space[2],
  },
  eyebrow: { ...t.type.board, color: t.color.text.primary, flexShrink: 1 },
  device: { flexDirection: 'row', alignItems: 'center', gap: t.space[1] },
  deviceLabel: {
    ...t.type.caption,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    color: t.color.text.secondary,
  },
}));

/**
 * AI output not yet saved: "track under construction" (dashed border over a hatched fill).
 * The container is labelled "Proposal, not saved: …" but stays non-accessible, so controls
 * inside remain individually reachable; the eyebrow row is what screen readers announce.
 */
export function ProposalCard({ eyebrow, onDevice = false, children }: ProposalCardProps) {
  const styles = useStyles();
  const theme = useTheme();
  const iconSize = useScaledIconSize(12, 'caption');
  const source = onDevice ? `${eyebrow}, on-device` : eyebrow;
  return (
    <View
      style={styles.card}
      accessible={false}
      accessibilityLabel={`Proposal, not saved: ${source}`}
    >
      <Hatch />
      <View style={styles.header} accessible accessibilityLabel={`${source}, not saved`}>
        <RNText style={styles.eyebrow} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.board}>
          {eyebrow}
        </RNText>
        {onDevice ? (
          <View style={styles.device}>
            <Ionicons
              name="lock-closed-outline"
              size={iconSize}
              color={theme.color.text.secondary}
            />
            <RNText
              style={styles.deviceLabel}
              maxFontSizeMultiplier={theme.maxFontSizeMultiplier.caption}
            >
              On-device
            </RNText>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}
