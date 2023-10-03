import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from 'native-base';
import moment from 'moment';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { TransactionSplitType, TransactionType } from '../../models/transactions';
import { RootDispatch, RootState } from '../../store';
import translate from '../../i18n/locale';
import { localNumberFormat, useThemeColors } from '../../lib/common';
import { ScreenType } from './types';

const ITEM_HEIGHT = 90;

const resetTransactionsDates = (transactions: TransactionSplitType[]) => transactions.map((t) => ({
  ...t,
  date: new Date().toISOString(),
}));

function ListFooterComponent({ loadMore }) {
  const { colors } = useThemeColors();
  const { loading } = useSelector((state: RootState) => state.loading.effects.transactions.getMoreTransactions);
  const { page, totalPages } = useSelector((state: RootState) => state.transactions);

  return useMemo(() => (loading || (page < totalPages)) && (
    <Box
      h={ITEM_HEIGHT}
      paddingLeft={2}
      backgroundColor={colors.tileBackgroundColor}
      borderBottomWidth={0.5}
      borderColor={colors.listBorderColor}
    >
      {(loading) && (
      <HStack justifyContent="space-between" alignItems="flex-start" space={3} paddingTop={3} paddingRight={3}>
        <HStack>
          <Skeleton w={8} h={8} m={1} ml={0} rounded={10} />
          <Skeleton.Text w={130} ml={2} lines={3} />
        </HStack>
        <Skeleton w={75} h={8} rounded={10} />
      </HStack>
      )}
      {(!loading && (page < totalPages)) && (
      <HStack justifyContent="center" alignItems="center" px={3} py={3}>
        <Button
          leftIcon={<Ionicons name="cloud-download" size={20} color="white" />}
          onPress={loadMore}
        >
          Load More
        </Button>
      </HStack>
      )}
    </Box>
  ), [
    loading,
  ]);
}

function RenderItem({ item }: { item: TransactionType }) {
  const { colors } = useThemeColors();
  const navigation = useNavigation();

  const goToEdit = (id: string, payload: { splits: TransactionSplitType[]; groupTitle: string; }) => navigation.dispatch(
    CommonActions.navigate({
      name: 'TransactionDetailScreen',
      params: {
        id,
        payload,
      },
    }),
  );

  const goToDuplicate = (payload: { splits: TransactionSplitType[]; groupTitle: string; }) => navigation.dispatch(
    CommonActions.navigate({
      name: 'TransactionCreateScreen',
      params: {
        payload,
      },
    }),
  );

  const colorItemTypes = {
    withdrawal: {
      bg: colors.brandNeutralLight,
      color: colors.brandNeutral,
      icon: 'arrow-up',
      prefix: '-',
    },
    deposit: {
      bg: colors.brandSuccessLight,
      color: colors.brandSuccess,
      icon: 'arrow-down',
      prefix: '+',
    },
    transfer: {
      bg: colors.brandInfoLight,
      color: colors.brandInfo,
      icon: 'arrow-left-right',
      prefix: '',
    },
    'opening balance': {
      bg: colors.brandNeutralLight,
      color: colors.brandNeutral,
      icon: 'arrow-left-right',
      prefix: '',
    },
  };

  const getTransactionTypeAttributes = (type: string) => {
    if (typeof colorItemTypes[type] === 'undefined') {
      return colorItemTypes.transfer;
    }

    return colorItemTypes[type];
  };

  return useMemo(() => (
    <Pressable
      h={ITEM_HEIGHT}
      paddingLeft={2}
      backgroundColor={colors.tileBackgroundColor}
      borderBottomWidth={0.5}
      borderColor={colors.listBorderColor}
      onPress={() => {
        goToEdit(item.id, {
          splits: item.attributes.transactions,
          groupTitle: item.attributes.groupTitle,
        });
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch();
        goToDuplicate({
          splits: resetTransactionsDates(item.attributes.transactions),
          groupTitle: item.attributes.groupTitle || 'Default title',
        });
      }}
    >
      <HStack justifyContent="space-between" alignItems="flex-start">
        <HStack alignItems="center">
          <Box style={{
            backgroundColor: getTransactionTypeAttributes(item.attributes.transactions[0].type).bg,
            borderRadius: 10,
            marginRight: 8,
            padding: 5,
          }}
          >
            <MaterialCommunityIcons
              name={getTransactionTypeAttributes(item.attributes.transactions[0].type).icon}
              size={24}
              color={getTransactionTypeAttributes(item.attributes.transactions[0].type).color}
            />
          </Box>
          <VStack>
            <Text
              fontFamily="Montserrat_Bold"
              maxW={200}
              numberOfLines={1}
              paddingTop={2}
            >
              {item.attributes.transactions.length > 1 ? `${item.attributes.transactions.length} splits • ${item.attributes.groupTitle}` : item.attributes.transactions[0].description}
            </Text>

            <Text
              fontSize="xs"
              alignSelf="flex-start"
              maxW={170}
              numberOfLines={1}
            >
              {`${item.attributes.transactions[0].type === 'withdrawal' ? `${item.attributes.transactions[0].sourceName}` : `${item.attributes.transactions[0].destinationName}`}`}
            </Text>

            <Text
              fontSize="xs"
              alignSelf="flex-start"
              maxW={170}
              numberOfLines={1}
            >
              {`${moment(item.attributes.transactions[0].date).format('ll')} • ${item.attributes.transactions[0].categoryName || ''}`}
            </Text>
            <HStack alignSelf="flex-start">
              {item.attributes.transactions[0].tags.filter((_, index) => index < 2).map((tag) => (
                <Badge
                  p={0}
                  mx={0.5}
                  px={0.5}
                  my={0}
                  key={tag}
                  borderRadius={5}
                >
                  <Text fontSize={10} color={colors.brandDark} numberOfLines={1} maxW={90}>{tag}</Text>
                </Badge>
              ))}
            </HStack>
          </VStack>
        </HStack>
        <Box style={{
          borderRadius: 10,
          backgroundColor: getTransactionTypeAttributes(item.attributes.transactions[0].type).bg,
          margin: 10,
          marginTop: 15,
          padding: 5,
        }}
        >
          <Text
            fontSize={15}
            fontFamily="Montserrat_Bold"
            style={{ color: getTransactionTypeAttributes(item.attributes.transactions[0].type).color }}
          >
            {`${getTransactionTypeAttributes(item.attributes.transactions[0].type).prefix}${localNumberFormat(item.attributes.transactions[0].currencyCode, item.attributes.transactions.reduce((total, split) => total + parseFloat(split.amount), 0))}`}
          </Text>
        </Box>
      </HStack>
    </Pressable>
  ), [item]);
}

async function deleteAlert(transaction: TransactionType, rowMap, closeRow, deleteRow) {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  Alert.alert(
    translate('transaction_list_alert_title'),
    `${translate('transaction_list_alert_text')}\n`
    + `${transaction?.attributes?.transactions[0]?.description}\n`
    + `${moment(transaction?.attributes?.transactions[0]?.date).format('ll')} • ${transaction?.attributes?.transactions[0]?.categoryName || ''}\n`,
    [
      {
        text: translate('transaction_list_delete_button'),
        onPress: () => deleteRow(transaction?.id),
        style: 'destructive',
      },
      {
        text: translate('transaction_list_cancel_button'),
        onPress: () => closeRow(transaction?.id, rowMap),
        style: 'cancel',
      },
    ],
  );
}

function RenderHiddenItem({ handleOnPressCopy, handleOnPressDelete }) {
  const { colors } = useThemeColors();

  return useMemo(() => (
    <HStack
      h={ITEM_HEIGHT}
      flexDirection="row"
      borderBottomWidth={0.5}
      borderColor={colors.listBorderColor}
    >
      <Pressable
        justifyContent="center"
        alignItems="flex-start"
        flex={1}
        backgroundColor={colors.brandWarning}
        onPress={handleOnPressCopy}
        px={5}
      >
        <VStack alignItems="center">
          <Icon as={<MaterialIcons name="content-copy" />} color="white" size="sm" />
          <Text color="white" fontSize="xs" fontWeight="medium">
            Clone
          </Text>
        </VStack>
      </Pressable>
      <Pressable
        justifyContent="center"
        alignItems="flex-end"
        flex={1}
        backgroundColor={colors.red}
        onPress={handleOnPressDelete}
        px={5}
      >
        <VStack alignItems="center">
          <Icon as={<MaterialIcons name="delete" />} color="white" size="sm" />
          <Text color="white" fontSize="xs" fontWeight="medium">
            Delete
          </Text>
        </VStack>
      </Pressable>
    </HStack>
  ), [handleOnPressCopy, handleOnPressDelete]);
}

export default function TransactionsScreen({ navigation, route }: ScreenType) {
  const { params } = route;
  const { loading: loadingRefresh } = useSelector((state: RootState) => state.loading.effects.transactions.getTransactions);
  const rangeDetails = useSelector((state: RootState) => state.firefly.rangeDetails);
  const currency = useSelector((state: RootState) => state.currencies.current);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const {
    transactions: {
      getMoreTransactions,
      getTransactions,
      deleteTransaction,
    },
  } = useDispatch<RootDispatch>();

  const onRefresh = async () => {
    const effectTransactions = await getTransactions();
    setTransactions(effectTransactions);
  };

  const prevFiltersRef = useRef<string>();
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (prevFiltersRef.current !== `${rangeDetails.start}-${rangeDetails.end}-${currency.id}` || params?.forceRefresh === true) {
        if (isActive) {
          onRefresh().then();
        }
        prevFiltersRef.current = `${rangeDetails.start}-${rangeDetails.end}-${currency.id}`;
      }

      return () => {
        isActive = false;
        navigation.setParams({ forceRefresh: null });
      };
    }, [
      params,
      rangeDetails,
      currency,
    ]),
  );

  const loadMore = useCallback(async () => {
    const effectTransactions = await getMoreTransactions();
    setTransactions([...transactions, ...effectTransactions]);
  }, [transactions, getMoreTransactions]);

  const closeRow = (rowKey: string | number, rowMap: { [x: string]: { closeRow: () => void; }; }) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  const deleteRow = (id: string) => {
    deleteTransaction(id);
    setTransactions((prevState) => prevState.filter((item) => item.id !== id));
  };

  const goToDuplicate = (payload: { splits: TransactionSplitType[]; groupTitle: string; }) => navigation.dispatch(
    CommonActions.navigate({
      name: 'TransactionCreateScreen',
      params: {
        payload,
      },
    }),
  );

  return useMemo(
    () => (
      <SwipeListView
        useNativeDriver
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={(
          <RefreshControl
            refreshing={loadingRefresh}
            onRefresh={onRefresh}
          />
        )}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        keyExtractor={(item: TransactionType) => item.id}
        data={transactions}
        showsVerticalScrollIndicator
        renderItem={({ item }) => <RenderItem item={item} />}
        renderHiddenItem={(data, rowMap) => (
          <RenderHiddenItem
            handleOnPressCopy={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch();
              goToDuplicate({
                splits: resetTransactionsDates(data.item.attributes.transactions),
                groupTitle: data.item.attributes.groupTitle || 'Default title',
              });
            }}
            handleOnPressDelete={() => deleteAlert(data.item, rowMap, closeRow, deleteRow)}
          />
        )}
        rightOpenValue={-90}
        stopRightSwipe={-190}
        rightActivationValue={-170}
        onRightActionStatusChange={({
          key,
          isActivated,
        }) => (isActivated ? deleteAlert(transactions.find((t) => t.id === key), [], closeRow, deleteRow) : null)}
        leftOpenValue={90}
        stopLeftSwipe={190}
        leftActivationValue={170}
        onLeftActionStatusChange={({
          key,
          isActivated,
        }) => (isActivated ? goToDuplicate({
          splits: resetTransactionsDates(transactions.find((t) => t.id === key).attributes.transactions),
          groupTitle: transactions.find((t) => t.id === key).attributes.groupTitle || 'Default title',
        }) : null)}
        contentContainerStyle={{ paddingBottom: 100 }}
        getItemLayout={(_, index: number) => ({ length: ITEM_HEIGHT + 1, offset: (ITEM_HEIGHT + 1) * index, index })}
        ListFooterComponent={() => <ListFooterComponent loadMore={loadMore} />}
      />
    ),
    [
      transactions,
      loadingRefresh,
    ],
  );
}
