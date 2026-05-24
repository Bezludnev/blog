import type { Payload } from "payload";

import type { PostMetric } from "../payload-types";
import {
  applyPostView,
  getPostMetricKey,
  getUtcDateKey,
} from "./post-metrics";

type RecordPostViewInput = {
  payload: Payload;
  postId: string;
  viewedAt?: Date;
  visitorHash?: string;
};

async function findPostMetric(payload: Payload, metricKey: string) {
  const result = await payload.find({
    collection: "post-metrics",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      metricKey: {
        equals: metricKey,
      },
    },
  });

  return result.docs[0] as PostMetric | undefined;
}

async function updatePostMetric({
  metric,
  payload,
  viewedAt,
  visitorHash,
}: {
  metric: PostMetric;
  payload: Payload;
  viewedAt: Date;
  visitorHash?: string;
}) {
  const nextMetric = applyPostView(metric, visitorHash);

  return payload.update({
    collection: "post-metrics",
    data: {
      lastViewedAt: viewedAt.toISOString(),
      uniqueViewsApprox: nextMetric.uniqueViewsApprox,
      views: nextMetric.views,
      visitorHashes: nextMetric.visitorHashes,
    },
    id: metric.id,
    overrideAccess: true,
  });
}

export async function recordPostView({
  payload,
  postId,
  viewedAt = new Date(),
  visitorHash,
}: RecordPostViewInput) {
  const dateKey = getUtcDateKey(viewedAt);
  const metricKey = getPostMetricKey(postId, dateKey);
  const metric = await findPostMetric(payload, metricKey);

  if (metric) {
    return updatePostMetric({ metric, payload, viewedAt, visitorHash });
  }

  const nextMetric = applyPostView(
    {
      uniqueViewsApprox: 0,
      views: 0,
      visitorHashes: [],
    },
    visitorHash,
  );

  try {
    return await payload.create({
      collection: "post-metrics",
      data: {
        date: dateKey,
        lastViewedAt: viewedAt.toISOString(),
        metricKey,
        post: postId,
        uniqueViewsApprox: nextMetric.uniqueViewsApprox,
        views: nextMetric.views,
        visitorHashes: nextMetric.visitorHashes,
      },
      overrideAccess: true,
    });
  } catch (error) {
    const retryMetric = await findPostMetric(payload, metricKey);

    if (retryMetric) {
      return updatePostMetric({
        metric: retryMetric,
        payload,
        viewedAt,
        visitorHash,
      });
    }

    throw error;
  }
}
