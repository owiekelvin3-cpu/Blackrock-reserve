export type SellReceiptData = {
  id: string;
  symbol: string;
  assetName: string;
  sharesSold: number;
  priceAtSale: number;
  grossProceeds: number;
  fee: number;
  netProceeds: number;
  costBasis: number;
  realizedPnl: number;
  createdAt: string;
};
