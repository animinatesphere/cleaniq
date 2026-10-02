// The cleaner's numbers from the server (jobs done, rating, earnings), refreshed whenever the
// screen comes into view. See server/utils/workerStats.js for how each is worked out.
import { useCallback, useContext, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { AuthContext, API_URL } from "../context/AuthContext";

export const EMPTY_STATS = {
  jobsDone: 0, rating: null, ratingCount: 0, totalEarned: 0, earnedThisMonth: 0,
  withdrawn: 0, onHold: 0, balance: 0, nextPayout: null,
};

// "4.8" with a count, or "New" until the first customer rates them.
export const ratingLabel = (s) => (s?.rating != null ? Number(s.rating).toFixed(1) : "New");

export default function useWorkerStats() {
  const { workerInfo } = useContext(AuthContext);
  const id = workerInfo?.id || workerInfo?._id;
  const [stats, setStats] = useState(null);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`${API_URL}/workers/${id}/stats`);
      setStats({ ...EMPTY_STATS, ...res.data });
    } catch {
      setStats((s) => s || EMPTY_STATS);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  return { stats: stats || EMPTY_STATS, loading: stats === null, reload };
}
