import {
  RepositoryFactoryHttp,
  MosaicId,
  MetadataType,
  Convert,
} from "symbol-sdk";
import { nodes } from "../nodes";

export type NemberArtNft = UnresolvedNemberArtNft | ResolvedNemberArtNft;

export type UnresolvedNemberArtNft = {
  mosaicIdHex: string;
  ipfsUrl?: string;
};

export type ResolvedNemberArtNft = {
  mosaicIdHex: string;
  ipfsUrl: string;
};

export async function resolve(
  mosaicIdHex: string,
  network: nodes.Network = "MAIN",
  nodeUrl: string | undefined = undefined
): Promise<ResolvedNemberArtNft | UnresolvedNemberArtNft | undefined> {
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
    const metadata = await metadataRepository
      .search({
        scopedMetadataKey: "D2E513530574930D",
        targetId: mosaicInfo.id,
        metadataType: MetadataType.Mosaic,
      })
      .toPromise();

    if (metadata.data.length > 0) {
      const ipfsContent =
        metadata.data[0].metadataEntry.value.indexOf("{") >= 0
          ? JSON.parse(metadata.data[0].metadataEntry.value)
          : JSON.parse(Convert.decodeHex(metadata.data[0].metadataEntry.value));
      const ipfsUrl = `https://ipfs.io/ipfs/${ipfsContent}`;
      return {
        mosaicIdHex,
        ipfsUrl,
      };
    } else {
      return {
        mosaicIdHex,
      };
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
