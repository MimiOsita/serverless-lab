import { marshall, marshallOptions, unmarshallOptions } from "@aws-sdk/util-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Movie, MovieCast } from "./types";

type Entity = Movie | MovieCast;  // NEW
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};

export function createDDbDocClient() {
  . . . . as before . . . . 
}
