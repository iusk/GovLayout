import PageLayout from '../components/PageLayout';
import ChamberView from '../components/chamber/ChamberView';

/** Senate (100 members) rendered with the shared U-shape ChamberView. */
export default function SenatePage() {
  return (
    <PageLayout title="Senate">
      <ChamberView chamber="SENATE" />
    </PageLayout>
  );
}
