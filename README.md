# symbol-nft-decoder

SDK to decode On-Chain-NFT data from Symbol Blockchain

## Note

The quality of this implementation is at a very experimental level at this time, so there is a high possibility that it will not work properly.

## Install

```shell
npm i symbol-nft-decoder

```

## Usage

### COMSA

```ts
import { comsa } from "symbol-nft-decoder";

(async () => {
  const mosaicIdHex: string = "YOUR_COMSA_NFT_MOSAIC_ID";
  const comsaNft = await comsa.resolve(mosaicIdHex);
  if (comsaNft === undefined) {
    console.error("Some error!");
  }
  if (comsaNft.dataUrl === undefined) {
    console.error("The mosaic is not COMSA NFT!");
  }
  const dataUrl = comsaNft.dataUrl; // Now, you can use this data for NFT viewer.
})();
```

### NEMber Art

```ts
import { nemberArt } from "symbol-nft-decoder";

(async () => {
  const mosaicIdHex: string = "YOUR_NEMber_Art_NFT_MOSAIC_ID";
  const nemberArtNft = await nemberArt.resolve(mosaicIdHex);
  if (nemberArtNft === undefined) {
    console.error("Some error!");
  }
  if (nemberArtNft.ipfsUrl === undefined) {
    console.error("The mosaic is not NEMber Art NFT!");
  }
  const ipfsUrl = nemberArtNft.dataUrl; // Now, you can use this URL for NFT viewer.
})();
```

### NFT Drive

```ts
import { nftDrive } from "symbol-nft-decoder";

(async () => {
  const mosaicIdHex: string = "YOUR_NFT_DRIVE_MOSAIC_ID";
  const nftDrive = await nftDrive.resolve(mosaicIdHex);
  if (nftDrive === undefined) {
    console.error("Some error!");
  }
  if (nftDrive.ipfsUrl === undefined) {
    console.error("The mosaic is not NFT Drive NFT!");
  }
  const dataUrl = nftDrive.dataUrl; // Now, you can use this data for NFT viewer.
})();
```

## Reference

The following article is very helpful. Thank you very much.

[https://qiita.com/nem_takanobu/items/67567eff96da6daf7456](https://qiita.com/nem_takanobu/items/67567eff96da6daf7456)
