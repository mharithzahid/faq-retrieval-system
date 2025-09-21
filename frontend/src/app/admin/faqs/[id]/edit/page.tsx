import FaqForm from '@/components/FaqForm';
import { getFaq } from '@/lib/api';

type Props = {
  params: { id: string };
};

export default async function EditFaqPage({ params }: Props) {
  const id = Number(params.id);
  const faq = await getFaq(id);

  return (
    <div>
      <h1>Edit FAQ #{faq.id}</h1>
      <FaqForm mode="edit" initial={faq} />
    </div>
  );
}
