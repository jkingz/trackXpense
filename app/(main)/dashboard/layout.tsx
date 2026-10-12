import { Suspense } from 'react';
import { BarLoader } from 'react-spinners';

import DashBoardPage from './page';

const DashBoardLayout = () => {
  return (
    <div className="px-5 ">
      <h1 className="text-6xl font-bold --gradient-title mb-5">Dashboard</h1>
      <Suspense
        fallback={
          <BarLoader
            className="mt-4"
            width={'100%'}
            height={5}
            color="#0ea5e9"
          />
        }
      >
        <DashBoardPage />
      </Suspense>
    </div>
  );
};

export default DashBoardLayout;
