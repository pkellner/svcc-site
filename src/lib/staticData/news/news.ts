// Static mirror of src/lib/prismaData/news/news.ts
import { global } from "@/lib/staticData/load";

export async function getAllNewsData(): Promise<any[]> {
  return global().allNewsData;
}
