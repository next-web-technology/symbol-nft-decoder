import axios from "axios";
import {
  RepositoryFactoryHttp,
  MosaicId,
  TransactionType,
  TransactionGroup,
  Order,
  TransferTransaction,
  AggregateTransaction,
} from "symbol-sdk";
import { nodes } from "../nodes";

export type nftDrive = UnresolvedNftDrive | ResolvedNftDrive;

export type UnresolvedNftDrive = {
  mosaicIdHex: string;
  address?: string;
  dataUrl?: string;
};

export type ResolvedNftDrive = {
  mosaicIdHex: string;
  address: string;
  dataUrl: string;
};

export type NgList = NgListElement[];

export type NgListElement = [string, string, string];

export async function fetchNgList(): Promise<NgList> {
  try {
    const response = await axios.get<NgList>(
      "https://nft-drive-data-explorer.tk/black_list/",
      { timeout: 5000 }
    );
    if (response.status === 200) {
      const ngList = response.data;
      return ngList;
    } else {
      return [];
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function resolve(
  mosaicIdHex: string,
  network: nodes.Network = "MAIN",
  nodeUrl: string | undefined = undefined
): Promise<ResolvedNftDrive | UnresolvedNftDrive | undefined> {
  try {
    const ngList = await fetchNgList();
    const isInNgList = ngList.find(
      (ngListElement) => ngListElement[1] === mosaicIdHex
    );
    if (isInNgList) {
      console.error("The mosaic is in NG List!");
      return undefined;
    }

    const randomNodeUrl = await nodes.fetchRandomNodeUrl(network);

    const repositoryFactoryHttp =
      nodeUrl === undefined
        ? new RepositoryFactoryHttp(randomNodeUrl)
        : new RepositoryFactoryHttp(nodeUrl);

    const mosaicRepository = repositoryFactoryHttp.createMosaicRepository();
    const mosaicId = new MosaicId(mosaicIdHex);
    const mosaicInfo = await mosaicRepository.getMosaic(mosaicId).toPromise();
    const ownerAddress = mosaicInfo.ownerAddress;

    const transactionRepository =
      repositoryFactoryHttp.createTransactionRepository();

    const paginatedTransferTransactionData = await transactionRepository
      .search({
        type: [TransactionType.TRANSFER],
        address: ownerAddress,
        group: TransactionGroup.Confirmed,
        pageSize: 10,
        order: Order.Asc,
      })
      .toPromise();
    const isNftDrive = paginatedTransferTransactionData.data.find(
      (transaction) => {
        if (transaction instanceof TransferTransaction) {
          if (transaction.message === undefined) {
            return false;
          } else if (
            transaction.message.payload ===
            "Please note that this mosaic is an NFT."
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    );
    if (!isNftDrive) {
      return {
        mosaicIdHex,
        address: ownerAddress.plain(),
      };
    }

    const paginatedAggregateTransactionData = await transactionRepository
      .search({
        type: [
          TransactionType.AGGREGATE_COMPLETE,
          TransactionType.AGGREGATE_BONDED,
        ],
        address: ownerAddress,
        group: TransactionGroup.Confirmed,
        pageSize: 100,
      })
      .toPromise();
    const aggregateTransactions = await Promise.all(
      paginatedAggregateTransactionData.data.map(
        async (aggregateTransaction) => {
          if (aggregateTransaction instanceof AggregateTransaction) {
            if (aggregateTransaction.transactionInfo?.hash) {
              return await transactionRepository
                .getTransaction(
                  aggregateTransaction.transactionInfo?.hash,
                  TransactionGroup.Confirmed
                )
                .toPromise();
            }
          }
        }
      )
    );

    const sortedAggregateTransactions = aggregateTransactions
      .filter((aggregateTransaction) => aggregateTransaction !== undefined)
      .filter(
        (aggregateTransaction) =>
          aggregateTransaction instanceof AggregateTransaction
      )
      .sort((a, b) => {
        if (
          a !== undefined &&
          a instanceof AggregateTransaction &&
          b !== undefined &&
          b instanceof AggregateTransaction
        ) {
          const innerTransactionFirstElementA = a.innerTransactions[0];
          const innerTransactionFirstElementB = b.innerTransactions[0];
          if (
            innerTransactionFirstElementA instanceof TransferTransaction &&
            innerTransactionFirstElementB instanceof TransferTransaction
          ) {
            if (
              Number(innerTransactionFirstElementA.message.payload) >
              Number(innerTransactionFirstElementB.message.payload)
            ) {
              return 1;
            } else {
              return -1;
            }
          } else {
            return -1;
          }
        } else {
          return -1;
        }
      });

    const dataUrlElements: string[] = [];
    sortedAggregateTransactions.forEach((aggregateTransaction) => {
      if (aggregateTransaction instanceof AggregateTransaction) {
        aggregateTransaction.innerTransactions.forEach(
          (transferTransaction) => {
            if (transferTransaction instanceof TransferTransaction) {
              dataUrlElements.push(transferTransaction.message.payload);
            }
          }
        );
      }
    });

    const dataUrl = dataUrlElements.join("");

    if (dataUrl.indexOf("data:image/") >= 0) {
      return {
        mosaicIdHex,
        address: ownerAddress.plain(),
        dataUrl,
      };
    } else {
      return {
        mosaicIdHex,
        address: ownerAddress.plain(),
      };
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
