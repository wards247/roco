import { useEffect, useState } from 'react';
import type { RocomPetDetail } from '../types/rocom';
import { ROCOM_DATA_BASE } from '../utils/rocomPets';

export const useRocomPetDetail = (baseId: number | null) => {
  const [detail, setDetail] = useState<RocomPetDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!baseId) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`${ROCOM_DATA_BASE}/pets/${baseId}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`精灵详情请求失败: ${response.status}`);
        }

        return response.json() as Promise<RocomPetDetail>;
      })
      .then((data) => {
        if (isMounted) {
          setDetail(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDetail(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [baseId]);

  return { detail, loading };
};
