import { serve } from 'inngest/next';

import { inngest } from '@/app/lib/inngest/client';
import { checkedBudgetAlert } from '@/app/lib/inngest/functions';

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [checkedBudgetAlert],
});
