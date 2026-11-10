import { Handler } from "aws-lambda";
import {
  QueryCommand,
  QueryCommandInput,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient, response } from "../shared/util";
import { MovieCast, MovieCastResponse } from "../shared/types";

const ddbDocClient = createDDbDocClient();

export const handler: Handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const queryParams = event.queryStringParameters;
    if (!queryParams) { 
      return response(400, { message: 'Missing query parameters' })
    }
    
    if (!queryParams.movieId) {
      return response(400,{ message: "Missing movie Id parameter" })
    }
    const movieId = parseInt(queryParams.movieId);
    if (isNaN(movieId)) {
      return response(400, { message: "Invalid movie Id parameter" })
    }
    let commandInput: QueryCommandInput = {
      TableName: process.env.CAST_TABLE_NAME,
    };
    if ("roleName" in queryParams) {
      commandInput = {
        ...commandInput,
        IndexName: "roleIx",
        KeyConditionExpression: "movieId = :m and begins_with(roleName, :r) ",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":r": queryParams.roleName,
        },
      };
    } else if ("actorName" in queryParams) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m and begins_with(actorName, :a) ",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":a": queryParams.actorName,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        ExpressionAttributeValues: {
          ":m": movieId,
        },
      };
    }
    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
    );

    const body: MovieCastResponse = {
      cast: commandOutput.Items as MovieCast[],
    };

    if (queryParams.facts === "true") {
      const movieCommandOutput = await ddbDocClient.send(
        new GetCommand({
          TableName: process.env.MOVIE_TABLE_NAME, // Make sure this env variable is in simple-app-stack.ts
          Key: { id: movieId },
        })
      );

      if (movieCommandOutput.Item) {
        body.movie = {
          title: movieCommandOutput.Item.title,
          genre_ids: movieCommandOutput.Item.genre_ids,
          overview: movieCommandOutput.Item.overview,
        };
      }
    }
    
    return response(200, { data: body })
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return response(500, { error: (error as Error).message })
  }
};

