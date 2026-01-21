import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Magazine {
    _id: string;
    title: string;
    description: string;
    price: number;
}

const Customer = () => {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMagazines = async () => {
            try {
                const res = await axios.get('/api/customer/magazines', { withCredentials: true });
                setMagazines(res.data);
            } catch (err) {
                navigate('/login');
            }
        };
        fetchMagazines();
    }, [navigate]);

    const handleSubscribe = async (id: string) => {
        try {
            await axios.post('/api/customer/subscribe', { magazineId: id }, { withCredentials: true });
            alert('Subscribed successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Subscription failed');
        }
    };

    return (
        <div className="customer-dashboard">
            <h2>Welcome to ஆச்சி வந்தாச்சு</h2>
            <div className="magazine-grid">
                {magazines.map(mag => (
                    <div key={mag._id} className="magazine-card">
                        <h3>{mag.title}</h3>
                        <p>{mag.description}</p>
                        <p>Rs. {mag.price}</p>
                        <button onClick={() => handleSubscribe(mag._id)}>Subscribe</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Customer;
