import { orderService } from '../src/modules/orders/order.service';
import { prisma } from '../src/config/database';
import crypto from 'crypto';

async function test() {
  try {
    const user = await prisma.user.findFirst({ where: { email: 'testuser@gmail.com' } });
    const service = await prisma.service.findFirst({ where: { status: 'ACTIVE' } });
    if (!user || !service) {
      console.log('User or service not found.');
      return;
    }

    console.log('Found user:', user.id);
    console.log('Found service:', service.id);

    const result = await orderService.createOrder(user.id, {
      idempotencyKey: crypto.randomUUID(),
      serviceId: service.id,
      amount: Number(service.mrp),
      consentGiven: true,
      consentText: 'I agree to terms.',
      fieldValues: [
        { fieldKey: 'aadhaar_number', fieldLabel: 'Aadhaar Number', value: '111122223333' },
        { fieldKey: 'pan_number', fieldLabel: 'PAN Card Number', value: 'ABCDE9999F' },
        { fieldKey: 'full_name', fieldLabel: 'Applicant Full Name', value: 'Mitra Concurrency Test' }
      ],
      documents: [
        {
          documentKey: 'aadhaar',
          documentName: 'Aadhaar Card Front',
          fileName: 'aadhaar.jpg',
          fileType: 'image/jpeg',
          fileSize: 102400,
          storagePath: `/users/${user.id}/temp/aadhaar.jpg`
        }
      ]
    });
    console.log('Success!', result);
  } catch (err) {
    console.error('Error during order creation:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
