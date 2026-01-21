import React from 'react';

interface MagazinesViewProps {
    data: any[];
    filter: string;
    setFilter: (val: string) => void;
    onAddMagazine: () => void;
    onEditMagazine: (mag: any) => void;
    onDeleteMagazine: (id: string) => void;
}

const MagazinesView: React.FC<MagazinesViewProps> = ({
    data, filter, setFilter, onAddMagazine, onEditMagazine, onDeleteMagazine
}) => {

    const filteredData = data.filter(item => {
        if (!filter) return true;
        const str = JSON.stringify(item).toLowerCase();
        return str.includes(filter.toLowerCase());
    });

    return (
        <div>
            <div className="view-header">
                <h1 className="view-title">Magazines</h1>
                <div className="view-actions">
                    <div className="search-wrapper">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search magazines..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={onAddMagazine}>
                        + Add Magazine
                    </button>
                </div>
            </div>

            <div className="table-container">
                {filteredData.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>No magazines found.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Periodicity</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 500 }}>{item.title}</td>
                                    <td>{item.category || '-'}</td>
                                    <td>{item.periodicity || '-'}</td>
                                    <td>₹{item.price}</td>
                                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => onEditMagazine(item)}
                                            className="btn btn-edit"
                                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDeleteMagazine(item._id)}
                                            className="btn btn-danger"
                                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MagazinesView;
