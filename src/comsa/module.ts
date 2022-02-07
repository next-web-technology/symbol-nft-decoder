import {
  RepositoryFactoryHttp,
  MosaicId,
  MetadataType,
  TransactionGroup,
  TransferTransaction,
  AggregateTransaction,
} from "symbol-sdk";
import { nodes } from "../nodes";

export type comsaNft = UnresolvedComsaNft | ResolvedComsaNft;

export type UnresolvedComsaNft = {
  mosaicIdHex: string;
  dataUrl?: string;
};

export type ResolvedComsaNft = {
  mosaicIdHex: string;
  dataUrl: string;
};

export async function resolve(
  mosaicIdHex: string,
  network: nodes.Network = "MAIN",
  nodeUrl: string | undefined = undefined
): Promise<ResolvedComsaNft | UnresolvedComsaNft | undefined> {
  try {
    const randomNodeUrl = await nodes.fetchRandomNodeUrl(network);

    const repositoryFactoryHttp =
      nodeUrl === undefined
        ? new RepositoryFactoryHttp(randomNodeUrl)
        : new RepositoryFactoryHttp(nodeUrl);

    const mosaicRepository = repositoryFactoryHttp.createMosaicRepository();
    const mosaicId = new MosaicId(mosaicIdHex);
    const mosaicInfo = await mosaicRepository.getMosaic(mosaicId).toPromise();

    const metadataRepository = repositoryFactoryHttp.createMetadataRepository();
    const paginatedMetadata = await metadataRepository
      .search({
        targetId: mosaicInfo.id,
        metadataType: MetadataType.Mosaic,
        pageSize: 100,
      })
      .toPromise();

    const comsaHeader = paginatedMetadata.data.find(
      (metadata) =>
        metadata.metadataEntry.scopedMetadataKey.toHex() === "DA030AA7795EBE75"
    );
    if (comsaHeader === undefined) {
      return {
        mosaicIdHex,
      };
    }
    const headerJson = JSON.parse(comsaHeader.metadataEntry.value);
    const dataUrlPrefix = `data:${headerJson.mim_type};base64,`;

    const metadata1 = paginatedMetadata.data.find(
      (metadata) =>
        metadata.metadataEntry.scopedMetadataKey.toHex() === "D77BFE313AF3EF1F"
    );
    const metadata2 = paginatedMetadata.data.find(
      (metadata) =>
        metadata.metadataEntry.scopedMetadataKey.toHex() === "AACFBE3CC93EABF3"
    );
    const metadata3 = paginatedMetadata.data.find(
      (metadata) =>
        metadata.metadataEntry.scopedMetadataKey.toHex() === "A0B069B710B3754C"
    );
    const metadata4 = paginatedMetadata.data.find(
      (metadata) =>
        metadata.metadataEntry.scopedMetadataKey.toHex() === "D75B016AA9FAC056"
    );

    const metadataEntryValue1 = metadata1?.metadataEntry.value
      ? metadata1?.metadataEntry.value
      : "";
    const metadataEntryValue2 = metadata2?.metadataEntry.value
      ? metadata1?.metadataEntry.value
      : "";
    const metadataEntryValue3 = metadata3?.metadataEntry.value
      ? metadata1?.metadataEntry.value
      : "";
    const metadataEntryValue4 = metadata4?.metadataEntry.value
      ? metadata1?.metadataEntry.value
      : "";

    const metadataArray: string[] = [];
    if (metadataEntryValue1) {
      const metadataArray1 = JSON.parse(metadataEntryValue1) as string[];
      metadataArray1.forEach((metadata) => {
        metadataArray.push(metadata);
      });
    } else {
      return {
        mosaicIdHex,
      };
    }
    if (metadataEntryValue2) {
      const metadataArray2 = JSON.parse(metadataEntryValue2) as string[];
      metadataArray2.forEach((metadata) => {
        metadataArray.push(metadata);
      });
    }
    if (metadataEntryValue3) {
      const metadataArray3 = JSON.parse(metadataEntryValue3) as string[];
      metadataArray3.forEach((metadata) => {
        metadataArray.push(metadata);
      });
    }
    if (metadataEntryValue4) {
      const metadataArray4 = JSON.parse(metadataEntryValue4) as string[];
      metadataArray4.forEach((metadata) => {
        metadataArray.push(metadata);
      });
    }

    const transactionRepository =
      repositoryFactoryHttp.createTransactionRepository();
    const aggregateTransactions = await Promise.all(
      metadataArray.map(async (metadata) => {
        return await transactionRepository
          .getTransaction(metadata, TransactionGroup.Confirmed)
          .toPromise();
      })
    );
    const dataArray: string[] = [];
    aggregateTransactions.forEach((aggregateTransaction) => {
      if (aggregateTransaction instanceof AggregateTransaction) {
        aggregateTransaction.innerTransactions.forEach(
          (transferTransaction) => {
            if (transferTransaction instanceof TransferTransaction) {
              const payload = transferTransaction.message.payload;
              dataArray.push(payload.slice(6));
            }
          }
        );
      }
    });
    const dataUrl = `${dataUrlPrefix}${dataArray.join("")}`;
    return {
      mosaicIdHex,
      dataUrl,
    };
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
